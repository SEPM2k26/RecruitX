const { body } = require('express-validator');
const { validate } = require('../middleware/validate.middleware');
const { applications, placementDrives, students, notifications, generateId } = require('../config/db');
const { checkStudentEligibility } = require('../services/student-eligibility.service');

// Application status flow
const STATUS_FLOW = ['Applied', 'Shortlisted', 'Aptitude', 'Technical Interview', 'HR Interview', 'Selected', 'Rejected'];

// ── Helpers ───────────────────────────────────────────────────────────────────
const enrichApp = (app) => {
  const student = students.find((s) => s.id === app.studentId);
  const drive = placementDrives.find((d) => d.id === app.driveId);
  return {
    ...app,
    student: student ? { id: student.id, name: student.name, email: student.email, cgpa: student.cgpa, branch: student.branch } : null,
    drive: drive ? { id: drive.id, jobRole: drive.jobRole, package: drive.package } : null,
  };
};

// ── Controllers ───────────────────────────────────────────────────────────────

/**
 * GET /api/admin/applications
 * Query: ?driveId=...&status=Applied&studentId=...
 */
const getAllApplications = (req, res) => {
  let result = [...applications];
  const { driveId, status, studentId } = req.query;

  if (driveId) result = result.filter((a) => a.driveId === driveId);
  if (status) result = result.filter((a) => a.status === status);
  if (studentId) result = result.filter((a) => a.studentId === studentId);

  res.json({ success: true, total: result.length, data: result.map(enrichApp) });
};

/**
 * GET /api/applications/student  — student's own applications
 */
const getMyApplications = (req, res) => {
  const result = applications.filter((a) => a.studentId === req.user.id);
  res.json({ success: true, total: result.length, data: result.map(enrichApp) });
};

/**
 * POST /api/drives/:id/apply  — student applies
 */
const applyForDrive = [
  body('resumeUrl').optional().isURL(),
  validate,
  (req, res) => {
    const driveId = req.params.id;
    const studentId = req.user.id;

    const drive = placementDrives.find((d) => d.id === driveId);
    if (!drive) return res.status(404).json({ success: false, message: 'Drive not found' });
    if (drive.status !== 'active') return res.status(400).json({ success: false, message: 'Drive is not accepting applications' });

    const student = students.find((s) => s.id === studentId);
    if (!student || student.isActive === false) return res.status(404).json({ success: false, message: 'Student account not found' });

    const duplicate = applications.find((a) => a.driveId === driveId && a.studentId === studentId);
    if (duplicate) return res.status(409).json({ success: false, message: 'Already applied for this drive' });

    const deadlineValue = /^\d{4}-\d{2}-\d{2}$/.test(drive.applicationDeadline)
      ? `${drive.applicationDeadline}T23:59:59.999Z`
      : drive.applicationDeadline;
    const deadline = new Date(deadlineValue);
    if (Number.isNaN(deadline.getTime()) || new Date() > deadline) {
      return res.status(400).json({ success: false, message: 'Application deadline has passed' });
    }

    const eligibility = checkStudentEligibility(student, drive);
    if (!eligibility.eligible) {
      return res.status(403).json({
        success: false,
        message: 'You do not meet the eligibility criteria for this drive.',
        eligible: false,
        checks: eligibility.checks,
      });
    }

    const newApp = {
      id: generateId('app'),
      studentId,
      driveId,
      status: 'Applied',
      resumeUrl: student.resumeUrl || null,
      appliedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    applications.push(newApp);

    res.status(201).json({ success: true, message: 'Application submitted', data: enrichApp(newApp) });
  },
];

/**
 * PATCH /api/admin/applications/:id/status
 * Body: { status: 'Shortlisted' | 'Aptitude' | ... }
 */
const updateApplicationStatus = [
  body('status').isIn(STATUS_FLOW).withMessage(`Status must be one of: ${STATUS_FLOW.join(', ')}`),
  validate,
  (req, res) => {
    const app = applications.find((a) => a.id === req.params.id);
    if (!app) return res.status(404).json({ success: false, message: 'Application not found' });

    app.status = req.body.status;
    app.updatedAt = new Date().toISOString();

    // Push notification to student
    notifications.push({
      id: generateId('notif'),
      userId: app.studentId,
      type: 'application_status',
      message: `Your application status has been updated to: ${req.body.status}`,
      read: false,
      createdAt: new Date().toISOString(),
    });

    res.json({ success: true, message: 'Application status updated', data: enrichApp(app) });
  },
];

/**
 * PATCH /api/admin/applications/:id/shortlist
 */
const shortlistApplication = (req, res) => {
  const app = applications.find((a) => a.id === req.params.id);
  if (!app) return res.status(404).json({ success: false, message: 'Application not found' });

  app.status = 'Shortlisted';
  app.updatedAt = new Date().toISOString();

  notifications.push({
    id: generateId('notif'),
    userId: app.studentId,
    type: 'shortlisted',
    message: `Congratulations! You have been shortlisted.`,
    read: false,
    createdAt: new Date().toISOString(),
  });

  res.json({ success: true, message: 'Student shortlisted', data: enrichApp(app) });
};

/**
 * PATCH /api/admin/applications/:id/reject
 */
const rejectApplication = (req, res) => {
  const app = applications.find((a) => a.id === req.params.id);
  if (!app) return res.status(404).json({ success: false, message: 'Application not found' });

  app.status = 'Rejected';
  app.updatedAt = new Date().toISOString();

  notifications.push({
    id: generateId('notif'),
    userId: app.studentId,
    type: 'rejected',
    message: `Your application has been rejected.`,
    read: false,
    createdAt: new Date().toISOString(),
  });

  res.json({ success: true, message: 'Application rejected', data: enrichApp(app) });
};

module.exports = {
  getAllApplications,
  getMyApplications,
  applyForDrive,
  updateApplicationStatus,
  shortlistApplication,
  rejectApplication,
};
