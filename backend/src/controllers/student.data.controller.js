const database = require('../config/postgres');
const students = require('../repositories/student.repository');
const { checkStudentEligibility } = require('../services/student-eligibility.service');
const { calculateProfileCompletion } = require('../services/student-profile.service');

const driveSelect = `
  SELECT d.*, c.name AS company_name, c.industry AS company_industry,
         c.website AS company_website, c.description AS company_description,
         c.contact_email AS company_contact_email, c.location AS company_location,
         c.logo_url AS company_logo_url
  FROM public.placement_drives d
  LEFT JOIN public.companies c ON c.id = d.company_id`;

const driveFromRow = (row) => ({
  id: row.id,
  companyId: row.company_id,
  jobRole: row.job_role,
  driveType: row.drive_type || 'placement',
  package: row.package,
  location: row.location,
  applicationDeadline: row.application_deadline,
  eligibleBranches: Array.isArray(row.eligible_branches) ? row.eligible_branches : [],
  minCGPA: Number(row.min_cgpa ?? 0),
  maxBacklogs: Number(row.max_backlogs ?? 0),
  graduationYear: row.graduation_year,
  description: row.description,
  status: row.status,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  company: row.company_id ? {
    id: row.company_id,
    name: row.company_name,
    industry: row.company_industry,
    website: row.company_website,
    description: row.company_description,
    contactEmail: row.company_contact_email,
    location: row.company_location,
    logoUrl: row.company_logo_url,
  } : null,
});

const trainingFromRow = (row, extras = {}) => {
  const enrolled = Array.isArray(row.enrolled_students) ? row.enrolled_students : [];
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    instructor: row.instructor,
    startDate: row.start_date,
    endDate: row.end_date,
    duration: row.duration,
    mode: row.mode,
    maxStudents: row.max_students,
    status: row.status,
    enrolledCount: enrolled.length,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    ...extras,
  };
};

async function getActiveStudent(authUserId, user = {}) {
  let student = await students.findByAuthUserId(authUserId);
  if (!student) {
    student = await students.findById(authUserId);
  }
  if (!student && user.email) {
    student = await students.findByEmail(user.email);
  }
  if (!student) return { response: { status: 404, message: 'Your student profile is not linked yet. Contact the placement office.' } };
  if (student.isActive === false) return { response: { status: 403, message: 'This student account is inactive.' } };
  return { student };
}

function handler(callback) {
  return async (req, res, next) => {
    try { await callback(req, res, next); } catch (error) { next(error); }
  };
}

const getPublicTrainings = handler(async (req, res) => {
  const { rows } = await database.query(`SELECT * FROM public.trainings ORDER BY start_date ASC NULLS LAST, created_at DESC`);
  const data = rows.map((row) => trainingFromRow(row));
  return res.json({ success: true, total: data.length, data });
});

const getPublicTrainingById = handler(async (req, res) => {
  const { rows } = await database.query('SELECT * FROM public.trainings WHERE id = $1 LIMIT 1', [req.params.id]);
  if (!rows[0]) return res.status(404).json({ success: false, message: 'Training not found.' });
  return res.json({ success: true, data: trainingFromRow(rows[0]) });
});

const getMyTrainings = handler(async (req, res) => {
  const context = await getActiveStudent(req.user.id, req.user);
  if (context.response) return res.status(context.response.status).json({ success: false, message: context.response.message });
  const { rows } = await database.query(
    `SELECT t.* FROM public.trainings t
     WHERE COALESCE(t.enrolled_students, '[]'::jsonb) @> to_jsonb(ARRAY[$1::text])
     ORDER BY t.start_date ASC NULLS LAST`, [context.student.id],
  );
  const data = rows.map((row) => trainingFromRow(row, { enrollmentStatus: 'Enrolled' }));
  return res.json({ success: true, total: data.length, data });
});

const enrollInTraining = handler(async (req, res) => {
  const context = await getActiveStudent(req.user.id, req.user);
  if (context.response) return res.status(context.response.status).json({ success: false, message: context.response.message });
  const result = await database.withTransaction(async (client) => {
    const { rows } = await client.query('SELECT * FROM public.trainings WHERE id = $1 FOR UPDATE', [req.params.id]);
    const training = rows[0];
    if (!training) return { error: { status: 404, message: 'Training not found.' } };
    if (['completed', 'cancelled', 'closed'].includes(String(training.status).toLowerCase())) {
      return { error: { status: 409, message: 'This training is not accepting enrollments.' } };
    }
    const enrolled = Array.isArray(training.enrolled_students) ? training.enrolled_students : [];
    if (enrolled.map(String).includes(String(context.student.id))) {
      return { error: { status: 409, message: 'You are already enrolled in this training.' } };
    }
    if (training.max_students && enrolled.length >= training.max_students) {
      return { error: { status: 409, message: 'This training has reached its enrollment limit.' } };
    }
    const updated = await client.query(
      `UPDATE public.trainings SET enrolled_students = COALESCE(enrolled_students, '[]'::jsonb) || to_jsonb(ARRAY[$2::text]), updated_at = NOW()
       WHERE id = $1 RETURNING *`, [req.params.id, context.student.id],
    );
    return { training: updated.rows[0] };
  });
  if (result.error) return res.status(result.error.status).json({ success: false, message: result.error.message });
  return res.status(201).json({ success: true, message: 'Enrolled in training.', data: trainingFromRow(result.training, { enrollmentStatus: 'Enrolled' }) });
});

const getDrives = handler(async (req, res) => {
  const values = [];
  const filters = [];
  if (req.query.status) { values.push(req.query.status); filters.push(`d.status = $${values.length}`); }
  if (req.query.companyId) { values.push(req.query.companyId); filters.push(`d.company_id = $${values.length}`); }
  if (req.query.driveType) { values.push(req.query.driveType); filters.push(`d.drive_type = $${values.length}`); }
  const { rows } = await database.query(`${driveSelect}${filters.length ? ` WHERE ${filters.join(' AND ')}` : ''} ORDER BY d.created_at DESC`, values);
  let data = rows.map(driveFromRow);
  if (req.query.branch) data = data.filter((drive) => drive.eligibleBranches.includes(req.query.branch));
  return res.json({ success: true, total: data.length, data });
});

const getDriveById = handler(async (req, res) => {
  const { rows } = await database.query(`${driveSelect} WHERE d.id = $1 LIMIT 1`, [req.params.id]);
  if (!rows[0]) return res.status(404).json({ success: false, message: 'Drive not found.' });
  return res.json({ success: true, data: driveFromRow(rows[0]) });
});

const checkEligibility = handler(async (req, res) => {
  const context = await getActiveStudent(req.user.id, req.user);
  if (context.response) return res.status(context.response.status).json({ success: false, message: context.response.message });
  const { rows } = await database.query(`${driveSelect} WHERE d.id = $1 LIMIT 1`, [req.params.id]);
  if (!rows[0]) return res.status(404).json({ success: false, message: 'Drive not found.' });
  const eligibility = checkStudentEligibility(context.student, driveFromRow(rows[0]));
  const applied = await database.query('SELECT 1 FROM public.applications WHERE student_id = $1 AND drive_id = $2 LIMIT 1', [context.student.id, req.params.id]);
  return res.json({ success: true, ...eligibility, applied: applied.rowCount > 0 });
});

const applyForDrive = handler(async (req, res) => {
  const context = await getActiveStudent(req.user.id, req.user);
  if (context.response) return res.status(context.response.status).json({ success: false, message: context.response.message });

  // Require 100% profile completion before allowing application
  const profileCompletion = calculateProfileCompletion(context.student);
  if (profileCompletion < 100) {
    return res.status(403).json({
      success: false,
      message: `Your profile is only ${profileCompletion}% complete. Please complete your profile (including resume, skills, CGPA, branch, graduation year, and phone) before applying.`,
      profileCompletion,
    });
  }

  const result = await database.withTransaction(async (client) => {
    const { rows } = await client.query(`${driveSelect} WHERE d.id = $1 FOR SHARE OF d`, [req.params.id]);
    if (!rows[0]) return { error: { status: 404, message: 'Drive not found.' } };
    const drive = driveFromRow(rows[0]);
    if (String(drive.status).toLowerCase() !== 'active') return { error: { status: 409, message: 'This drive is not accepting applications.' } };
    if (drive.applicationDeadline && new Date(`${String(drive.applicationDeadline).slice(0, 10)}T23:59:59.999Z`) < new Date()) {
      return { error: { status: 409, message: 'The application deadline has passed.' } };
    }
    const eligibility = checkStudentEligibility(context.student, drive);
    if (!eligibility.eligible) return { error: { status: 422, message: 'You do not meet the eligibility requirements.', eligibility } };
    await client.query('SELECT pg_advisory_xact_lock(hashtextextended($1, 0))', [`${context.student.id}:${drive.id}`]);
    const existing = await client.query('SELECT id FROM public.applications WHERE student_id = $1 AND drive_id = $2 LIMIT 1', [context.student.id, drive.id]);
    if (existing.rowCount) return { error: { status: 409, message: 'You have already applied to this drive.' } };
    const { rows: inserted } = await client.query(
      `INSERT INTO public.applications (id, student_id, drive_id, status, resume_url, applied_at, updated_at)
       VALUES ($1, $2, $3, 'Applied', $4, NOW(), NOW()) RETURNING *`,
      [randomId(), context.student.id, drive.id, context.student.resumeStoragePath],
    );
    return { application: inserted[0], drive };
  });
  if (result.error) return res.status(result.error.status).json({ success: false, message: result.error.message, ...(result.error.eligibility || {}) });
  return res.status(201).json({ success: true, message: 'Application submitted.', data: applicationFromRow(result.application, result.drive) });
});

const getMyApplications = handler(async (req, res) => {
  const context = await getActiveStudent(req.user.id, req.user);
  if (context.response) return res.status(context.response.status).json({ success: false, message: context.response.message });
  const { rows } = await database.query(
    `SELECT a.*, d.job_role, d.package, d.location, d.application_deadline, d.status AS drive_status,
            c.id AS company_id, c.name AS company_name, c.logo_url AS company_logo_url
     FROM public.applications a LEFT JOIN public.placement_drives d ON d.id = a.drive_id
     LEFT JOIN public.companies c ON c.id = d.company_id
     WHERE a.student_id = $1 ORDER BY a.applied_at DESC`, [context.student.id],
  );
  const data = rows.map((row) => applicationFromRow(row, row.job_role ? {
    id: row.drive_id, jobRole: row.job_role, package: row.package, location: row.location,
    applicationDeadline: row.application_deadline, status: row.drive_status,
    company: row.company_id ? { id: row.company_id, name: row.company_name, logoUrl: row.company_logo_url } : null,
  } : null));
  return res.json({ success: true, total: data.length, data });
});

function applicationFromRow(row, drive) {
  return {
    id: row.id, studentId: row.student_id, driveId: row.drive_id, status: row.status,
    resumeUrl: row.resume_url, appliedAt: row.applied_at, updatedAt: row.updated_at, drive: drive || null,
  };
}

const getMyInterviews = handler(async (req, res) => {
  const context = await getActiveStudent(req.user.id, req.user);
  if (context.response) return res.status(context.response.status).json({ success: false, message: context.response.message });
  const { rows } = await database.query(
    `SELECT i.*, d.job_role, c.name AS company_name
     FROM public.interviews i LEFT JOIN public.placement_drives d ON d.id = i.drive_id
     LEFT JOIN public.companies c ON c.id = d.company_id
     WHERE i.student_id = $1 ORDER BY i.scheduled_at ASC NULLS LAST`, [context.student.id],
  );
  const data = rows.map((row) => ({
    id: row.id, studentId: row.student_id, driveId: row.drive_id, applicationId: row.application_id,
    round: row.round, scheduledAt: row.scheduled_at, mode: row.mode, meetingLink: row.meeting_link,
    venue: row.venue, status: row.status, result: row.result, feedback: row.feedback,
    createdAt: row.created_at, updatedAt: row.updated_at,
    drive: row.drive_id ? { id: row.drive_id, jobRole: row.job_role, company: row.company_name ? { name: row.company_name } : null } : null,
  }));
  return res.json({ success: true, total: data.length, data });
});

const getMyNotifications = handler(async (req, res) => {
  const context = await getActiveStudent(req.user.id, req.user);
  if (context.response) return res.status(context.response.status).json({ success: false, message: context.response.message });
  const { rows } = await database.query('SELECT * FROM public.notifications WHERE user_id = $1 ORDER BY created_at DESC', [context.student.id]);
  return res.json({ success: true, total: rows.length, data: rows.map(notificationFromRow) });
});

const markNotificationRead = handler(async (req, res) => {
  const context = await getActiveStudent(req.user.id, req.user);
  if (context.response) return res.status(context.response.status).json({ success: false, message: context.response.message });
  const { rows } = await database.query(
    'UPDATE public.notifications SET read = TRUE WHERE id = $1 AND user_id = $2 RETURNING *',
    [req.params.id, context.student.id],
  );
  if (!rows[0]) return res.status(404).json({ success: false, message: 'Notification not found.' });
  return res.json({ success: true, message: 'Notification marked as read.', data: notificationFromRow(rows[0]) });
});

function notificationFromRow(row) {
  return { id: row.id, userId: row.user_id, type: row.type, message: row.message, read: row.read, createdAt: row.created_at };
}

function randomId() { return `app_${require('crypto').randomUUID()}`; }

module.exports = {
  getPublicTrainings, getPublicTrainingById, getMyTrainings, enrollInTraining,
  getDrives, getDriveById, checkEligibility, applyForDrive, getMyApplications,
  getMyInterviews, getMyNotifications, markNotificationRead,
};
