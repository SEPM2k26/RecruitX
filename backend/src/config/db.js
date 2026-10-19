const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');
const config = require('./config');

// Strip sslmode from connectionString so the explicit ssl config wins
const dbUrl = config.db.url || '';
const needsSsl = /sslmode=(require|verify-ca|verify-full|prefer)/.test(dbUrl);
const cleanedUrl = needsSsl
  ? dbUrl.replace(/([?&])sslmode=[^&]*/g, '$1').replace(/[?&]$/, '')
  : dbUrl;

const poolConfig = config.db.url
  ? { connectionString: cleanedUrl, ssl: needsSsl ? { rejectUnauthorized: false } : config.db.ssl }
  : {
    host: config.db.host,
    port: config.db.port,
    database: config.db.name,
    user: config.db.user,
    password: config.db.password,
    ssl: config.db.ssl,
  };

const pool = new Pool(poolConfig);

pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client:', err);
});

const generateId = (prefix) => `${prefix}-${uuidv4().split('-')[0]}`;

// ── Models ────────────────────────────────────────────────────────────────────

const admins = {
  async findByEmail(email) {
    const res = await pool.query(
      'SELECT id, name, email, password, role, created_at AS "createdAt" FROM admins WHERE LOWER(email) = LOWER($1)',
      [email]
    );
    return res.rows[0] || null;
  },

  async findById(id) {
    const res = await pool.query(
      'SELECT id, name, email, password, role, created_at AS "createdAt" FROM admins WHERE id = $1',
      [id]
    );
    return res.rows[0] || null;
  },

  async create({ name, email, password, role = 'admin' }) {
    const id = generateId('admin');
    const res = await pool.query(
      `INSERT INTO admins (id, name, email, password, role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, email, password, role, created_at AS "createdAt"`,
      [id, name, email, password, role]
    );
    return res.rows[0];
  },
};

const STUDENT_SELECT = `
  id, name, email, registration_number AS "registrationNumber", password, role,
  cgpa::float AS cgpa, branch, graduation_year AS "graduationYear", backlogs, phone,
  skills, linkedin_url AS "linkedinUrl", portfolio_url AS "portfolioUrl",
  resume_url AS "resumeUrl", resume_file_name AS "resumeFileName",
  resume_storage_path AS "resumeStoragePath", resume_mime_type AS "resumeMimeType",
  resume_size AS "resumeSize", resume_uploaded_at AS "resumeUploadedAt",
  is_active AS "isActive", created_at AS "createdAt", updated_at AS "updatedAt"
`;

const students = {
  async findAll({ search, branch, graduationYear, isActive } = {}) {
    let query = `
      SELECT ${STUDENT_SELECT}
      FROM students
      WHERE 1=1
    `;
    const params = [];

    if (search) {
      params.push(`%${search.toLowerCase()}%`);
      query += ` AND (LOWER(name) LIKE $${params.length} OR LOWER(email) LIKE $${params.length})`;
    }
    if (branch) {
      params.push(branch);
      query += ` AND branch = $${params.length}`;
    }
    if (graduationYear) {
      params.push(parseInt(graduationYear, 10));
      query += ` AND graduation_year = $${params.length}`;
    }
    if (isActive !== undefined) {
      params.push(isActive === 'true' || isActive === true);
      query += ` AND is_active = $${params.length}`;
    }

    query += ' ORDER BY created_at DESC';
    const res = await pool.query(query, params);
    return res.rows;
  },

  async findById(id) {
    const res = await pool.query(
      `SELECT ${STUDENT_SELECT} FROM students WHERE id = $1`,
      [id]
    );
    return res.rows[0] || null;
  },

  async findByEmail(email) {
    const res = await pool.query(
      `SELECT ${STUDENT_SELECT} FROM students WHERE LOWER(email) = LOWER($1)`,
      [email]
    );
    return res.rows[0] || null;
  },

  async findByRegistrationNumber(registrationNumber) {
    const res = await pool.query(
      `SELECT ${STUDENT_SELECT} FROM students WHERE UPPER(registration_number) = UPPER($1)`,
      [registrationNumber]
    );
    return res.rows[0] || null;
  },

  async create(data) {
    const id = data.id || generateId('stu');
    const res = await pool.query(
      `INSERT INTO students (
         id, name, email, registration_number, password, role, cgpa, branch,
         graduation_year, backlogs, phone, skills, linkedin_url, portfolio_url,
         resume_url, resume_file_name, resume_storage_path, resume_mime_type,
         resume_size, resume_uploaded_at, is_active
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
       RETURNING ${STUDENT_SELECT}`,
      [
        id,
        data.name,
        data.email,
        data.registrationNumber || null,
        data.password,
        data.role || 'student',
        data.cgpa || 0.0,
        data.branch || null,
        data.graduationYear || null,
        data.backlogs || 0,
        data.phone || null,
        JSON.stringify(data.skills || []),
        data.linkedinUrl || null,
        data.portfolioUrl || null,
        data.resumeUrl || null,
        data.resumeFileName || null,
        data.resumeStoragePath || null,
        data.resumeMimeType || null,
        data.resumeSize || null,
        data.resumeUploadedAt || null,
        data.isActive !== undefined ? data.isActive : true,
      ]
    );
    return res.rows[0];
  },

  async update(id, updates) {
    const fields = [];
    const values = [];

    const fieldMap = {
      name: 'name',
      phone: 'phone',
      cgpa: 'cgpa',
      branch: 'branch',
      graduationYear: 'graduation_year',
      backlogs: 'backlogs',
      skills: 'skills',
      registrationNumber: 'registration_number',
      linkedinUrl: 'linkedin_url',
      portfolioUrl: 'portfolio_url',
      resumeUrl: 'resume_url',
      resumeFileName: 'resume_file_name',
      resumeStoragePath: 'resume_storage_path',
      resumeMimeType: 'resume_mime_type',
      resumeSize: 'resume_size',
      resumeUploadedAt: 'resume_uploaded_at',
      isActive: 'is_active',
    };

    Object.keys(updates).forEach((key) => {
      if (fieldMap[key] && updates[key] !== undefined) {
        values.push(key === 'skills' ? JSON.stringify(updates[key]) : updates[key]);
        fields.push(`${fieldMap[key]} = $${values.length}`);
      }
    });

    if (fields.length === 0) return this.findById(id);

    fields.push(`updated_at = NOW()`);
    values.push(id);

    const res = await pool.query(
      `UPDATE students
       SET ${fields.join(', ')}
       WHERE id = $${values.length}
       RETURNING ${STUDENT_SELECT}`,
      values
    );
    return res.rows[0] || null;
  },

  async delete(id) {
    const res = await pool.query('DELETE FROM students WHERE id = $1 RETURNING id', [id]);
    return res.rowCount > 0;
  },
};

const companies = {
  async findAll({ search, industry } = {}) {
    let query = `
      SELECT id, name, industry, website, description,
             contact_email AS "contactEmail", contact_phone AS "contactPhone",
             location, logo_url AS "logoUrl",
             created_at AS "createdAt", updated_at AS "updatedAt"
      FROM companies
      WHERE 1=1
    `;
    const params = [];

    if (search) {
      params.push(`%${search.toLowerCase()}%`);
      query += ` AND LOWER(name) LIKE $${params.length}`;
    }
    if (industry) {
      params.push(industry);
      query += ` AND industry = $${params.length}`;
    }

    query += ' ORDER BY created_at DESC';
    const res = await pool.query(query, params);
    return res.rows;
  },

  async findById(id) {
    const res = await pool.query(
      `SELECT id, name, industry, website, description,
              contact_email AS "contactEmail", contact_phone AS "contactPhone",
              location, logo_url AS "logoUrl",
              created_at AS "createdAt", updated_at AS "updatedAt"
       FROM companies WHERE id = $1`,
      [id]
    );
    return res.rows[0] || null;
  },

  async findByName(name) {
    const res = await pool.query(
      `SELECT id, name FROM companies WHERE LOWER(name) = LOWER($1)`,
      [name]
    );
    return res.rows[0] || null;
  },

  async create(data) {
    const id = generateId('comp');
    const res = await pool.query(
      `INSERT INTO companies (id, name, industry, website, description, contact_email, contact_phone, location, logo_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id, name, industry, website, description,
                 contact_email AS "contactEmail", contact_phone AS "contactPhone",
                 location, logo_url AS "logoUrl",
                 created_at AS "createdAt", updated_at AS "updatedAt"`,
      [
        id,
        data.name,
        data.industry,
        data.website || null,
        data.description || null,
        data.contactEmail || null,
        data.contactPhone || null,
        data.location || null,
        data.logoUrl || null,
      ]
    );
    return res.rows[0];
  },

  async update(id, updates) {
    const fields = [];
    const values = [];

    const fieldMap = {
      name: 'name',
      industry: 'industry',
      website: 'website',
      description: 'description',
      contactEmail: 'contact_email',
      contactPhone: 'contact_phone',
      location: 'location',
      logoUrl: 'logo_url',
    };

    Object.keys(updates).forEach((key) => {
      if (fieldMap[key] && updates[key] !== undefined) {
        values.push(updates[key]);
        fields.push(`${fieldMap[key]} = $${values.length}`);
      }
    });

    if (fields.length === 0) return this.findById(id);

    fields.push(`updated_at = NOW()`);
    values.push(id);

    const res = await pool.query(
      `UPDATE companies
       SET ${fields.join(', ')}
       WHERE id = $${values.length}
       RETURNING id, name, industry, website, description,
                 contact_email AS "contactEmail", contact_phone AS "contactPhone",
                 location, logo_url AS "logoUrl",
                 created_at AS "createdAt", updated_at AS "updatedAt"`,
      values
    );
    return res.rows[0] || null;
  },

  async delete(id) {
    const res = await pool.query('DELETE FROM companies WHERE id = $1 RETURNING id', [id]);
    return res.rowCount > 0;
  },
};

const trainings = {
  async findAll({ status } = {}) {
    let query = `
      SELECT id, title, description, instructor,
             start_date AS "startDate", end_date AS "endDate",
             duration, mode, max_students AS "maxStudents",
             status, enrolled_students AS "enrolledStudents",
             created_at AS "createdAt", updated_at AS "updatedAt"
      FROM trainings
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      params.push(status);
      query += ` AND status = $${params.length}`;
    }

    query += ' ORDER BY created_at DESC';
    const res = await pool.query(query, params);
    return res.rows;
  },

  async findById(id) {
    const res = await pool.query(
      `SELECT id, title, description, instructor,
              start_date AS "startDate", end_date AS "endDate",
              duration, mode, max_students AS "maxStudents",
              status, enrolled_students AS "enrolledStudents",
              created_at AS "createdAt", updated_at AS "updatedAt"
       FROM trainings WHERE id = $1`,
      [id]
    );
    return res.rows[0] || null;
  },

  async create(data) {
    const id = generateId('train');
    const res = await pool.query(
      `INSERT INTO trainings (id, title, description, instructor, start_date, end_date, duration, mode, max_students, status, enrolled_students)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING id, title, description, instructor,
                 start_date AS "startDate", end_date AS "endDate",
                 duration, mode, max_students AS "maxStudents",
                 status, enrolled_students AS "enrolledStudents",
                 created_at AS "createdAt", updated_at AS "updatedAt"`,
      [
        id,
        data.title,
        data.description || '',
        data.instructor,
        data.startDate,
        data.endDate,
        data.duration || null,
        data.mode || 'online',
        data.maxStudents || 50,
        data.status || 'upcoming',
        JSON.stringify(data.enrolledStudents || []),
      ]
    );
    return res.rows[0];
  },

  async update(id, updates) {
    const fields = [];
    const values = [];

    const fieldMap = {
      title: 'title',
      description: 'description',
      instructor: 'instructor',
      startDate: 'start_date',
      endDate: 'end_date',
      duration: 'duration',
      mode: 'mode',
      maxStudents: 'max_students',
      status: 'status',
      enrolledStudents: 'enrolled_students',
    };

    Object.keys(updates).forEach((key) => {
      if (fieldMap[key] && updates[key] !== undefined) {
        values.push(key === 'enrolledStudents' ? JSON.stringify(updates[key]) : updates[key]);
        fields.push(`${fieldMap[key]} = $${values.length}`);
      }
    });

    if (fields.length === 0) return this.findById(id);

    fields.push(`updated_at = NOW()`);
    values.push(id);

    const res = await pool.query(
      `UPDATE trainings
       SET ${fields.join(', ')}
       WHERE id = $${values.length}
       RETURNING id, title, description, instructor,
                 start_date AS "startDate", end_date AS "endDate",
                 duration, mode, max_students AS "maxStudents",
                 status, enrolled_students AS "enrolledStudents",
                 created_at AS "createdAt", updated_at AS "updatedAt"`,
      values
    );
    return res.rows[0] || null;
  },

  async delete(id) {
    const res = await pool.query('DELETE FROM trainings WHERE id = $1 RETURNING id', [id]);
    return res.rowCount > 0;
  },

  async enroll(id, studentId) {
    const training = await this.findById(id);
    if (!training) return { error: 'Training not found', code: 404 };

    const enrolled = training.enrolledStudents || [];
    if (enrolled.includes(studentId)) {
      return { error: 'Already enrolled', code: 409 };
    }
    if (enrolled.length >= training.maxStudents) {
      return { error: 'Training is full', code: 400 };
    }

    enrolled.push(studentId);
    const updated = await this.update(id, { enrolledStudents: enrolled });
    return { data: updated };
  },
};

const placementDrives = {
  async findAll({ status, branch, companyId, driveType } = {}) {
    let query = `
      SELECT d.id, d.company_id AS "companyId", d.job_role AS "jobRole",
             COALESCE(d.drive_type, 'placement') AS "driveType", d.package,
             d.location, d.application_deadline AS "applicationDeadline",
             d.eligible_branches AS "eligibleBranches", d.min_cgpa::float AS "minCGPA",
             d.max_backlogs AS "maxBacklogs", d.graduation_year AS "graduationYear",
             d.description, d.status, d.created_at AS "createdAt", d.updated_at AS "updatedAt",
             json_build_object(
               'id', c.id,
               'name', c.name,
               'industry', c.industry,
               'location', c.location,
               'contactEmail', c.contact_email
             ) AS company
      FROM placement_drives d
      LEFT JOIN companies c ON d.company_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      params.push(status);
      query += ` AND d.status = $${params.length}`;
    }
    if (driveType) {
      params.push(driveType);
      query += ` AND d.drive_type = $${params.length}`;
    }
    if (companyId) {
      params.push(companyId);
      query += ` AND d.company_id = $${params.length}`;
    }
    if (branch) {
      params.push(branch);
      query += ` AND d.eligible_branches ? $${params.length}`;
    }

    query += ' ORDER BY d.created_at DESC';
    const res = await pool.query(query, params);
    return res.rows;
  },

  async findById(id) {
    const res = await pool.query(
      `SELECT d.id, d.company_id AS "companyId", d.job_role AS "jobRole",
              COALESCE(d.drive_type, 'placement') AS "driveType", d.package,
              d.location, d.application_deadline AS "applicationDeadline",
              d.eligible_branches AS "eligibleBranches", d.min_cgpa::float AS "minCGPA",
              d.max_backlogs AS "maxBacklogs", d.graduation_year AS "graduationYear",
              d.description, d.status, d.created_at AS "createdAt", d.updated_at AS "updatedAt",
              json_build_object(
                'id', c.id,
                'name', c.name,
                'industry', c.industry,
                'location', c.location,
                'contactEmail', c.contact_email
              ) AS company
       FROM placement_drives d
       LEFT JOIN companies c ON d.company_id = c.id
       WHERE d.id = $1`,
      [id]
    );
    return res.rows[0] || null;
  },

  async create(data) {
    const id = generateId('drive');
    const res = await pool.query(
      `INSERT INTO placement_drives (id, company_id, job_role, drive_type, package, location, application_deadline, eligible_branches, min_cgpa, max_backlogs, graduation_year, description, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       RETURNING id, company_id AS "companyId", job_role AS "jobRole", drive_type AS "driveType", package,
                 location, application_deadline AS "applicationDeadline",
                 eligible_branches AS "eligibleBranches", min_cgpa::float AS "minCGPA",
                 max_backlogs AS "maxBacklogs", graduation_year AS "graduationYear",
                 description, status, created_at AS "createdAt", updated_at AS "updatedAt"`,
      [
        id,
        data.companyId,
        data.jobRole,
        data.driveType || 'placement',
        data.package,
        data.location,
        data.applicationDeadline,
        JSON.stringify(data.eligibleBranches || []),
        parseFloat(data.minCGPA) || 0.0,
        parseInt(data.maxBacklogs, 10) || 0,
        parseInt(data.graduationYear, 10),
        data.description || '',
        data.status || 'active',
      ]
    );
    return this.findById(res.rows[0].id);
  },

  async update(id, updates) {
    const fields = [];
    const values = [];

    const fieldMap = {
      jobRole: 'job_role',
      driveType: 'drive_type',
      package: 'package',
      location: 'location',
      applicationDeadline: 'application_deadline',
      eligibleBranches: 'eligible_branches',
      minCGPA: 'min_cgpa',
      maxBacklogs: 'max_backlogs',
      graduationYear: 'graduation_year',
      description: 'description',
      status: 'status',
    };

    Object.keys(updates).forEach((key) => {
      if (fieldMap[key] && updates[key] !== undefined) {
        values.push(key === 'eligibleBranches' ? JSON.stringify(updates[key]) : updates[key]);
        fields.push(`${fieldMap[key]} = $${values.length}`);
      }
    });

    if (fields.length === 0) return this.findById(id);

    fields.push(`updated_at = NOW()`);
    values.push(id);

    await pool.query(
      `UPDATE placement_drives
       SET ${fields.join(', ')}
       WHERE id = $${values.length}`,
      values
    );
    return this.findById(id);
  },

  async delete(id) {
    const res = await pool.query('DELETE FROM placement_drives WHERE id = $1 RETURNING id', [id]);
    return res.rowCount > 0;
  },
};

const applications = {
  async findAll({ driveId, status, studentId } = {}) {
    let query = `
      SELECT a.id, a.id AS "applicationId", a.student_id AS "studentId", a.drive_id AS "driveId",
             a.status, a.applied_at AS "appliedAt", a.updated_at AS "updatedAt",
             json_build_object(
               'id', s.id,
               'name', s.name,
               'email', s.email,
               'cgpa', s.cgpa::float,
               'branch', s.branch,
               'resumeUrl', s.resume_url,
               'resumeFileName', s.resume_file_name,
               'resumeStoragePath', s.resume_storage_path
             ) AS student,
             json_build_object(
               'id', d.id,
               'jobRole', d.job_role,
               'driveType', COALESCE(d.drive_type, 'placement'),
               'package', d.package
             ) AS drive
      FROM applications a
      LEFT JOIN students s ON a.student_id = s.id
      LEFT JOIN placement_drives d ON a.drive_id = d.id
      WHERE 1=1
    `;
    const params = [];

    if (driveId) {
      params.push(driveId);
      query += ` AND a.drive_id = $${params.length}`;
    }
    if (status) {
      params.push(status);
      query += ` AND a.status = $${params.length}`;
    }
    if (studentId) {
      params.push(studentId);
      query += ` AND a.student_id = $${params.length}`;
    }

    query += ' ORDER BY a.applied_at DESC';
    const res = await pool.query(query, params);
    return res.rows;
  },

  async findById(id) {
    const res = await pool.query(
      `SELECT a.id, a.id AS "applicationId", a.student_id AS "studentId", a.drive_id AS "driveId",
              a.status, a.applied_at AS "appliedAt", a.updated_at AS "updatedAt",
              json_build_object(
                'id', s.id,
                'name', s.name,
                'email', s.email,
                'cgpa', s.cgpa::float,
                'branch', s.branch,
                'resumeUrl', s.resume_url,
                'resumeFileName', s.resume_file_name,
                'resumeStoragePath', s.resume_storage_path
              ) AS student,
              json_build_object(
                'id', d.id,
                'jobRole', d.job_role,
                'driveType', COALESCE(d.drive_type, 'placement'),
                'package', d.package
              ) AS drive
       FROM applications a
       LEFT JOIN students s ON a.student_id = s.id
       LEFT JOIN placement_drives d ON a.drive_id = d.id
       WHERE a.id = $1`,
      [id]
    );
    return res.rows[0] || null;
  },

  async findByStudentAndDrive(studentId, driveId) {
    const res = await pool.query(
      `SELECT id FROM applications WHERE student_id = $1 AND drive_id = $2`,
      [studentId, driveId]
    );
    return res.rows[0] || null;
  },

  async create({ studentId, driveId, status = 'Applied' }) {
    const id = generateId('app');
    await pool.query(
      `INSERT INTO applications (id, student_id, drive_id, status)
       VALUES ($1, $2, $3, $4)`,
      [id, studentId, driveId, status]
    );
    return this.findById(id);
  },

  async updateStatus(id, status) {
    const res = await pool.query(
      `UPDATE applications
       SET status = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING id, student_id AS "studentId"`,
      [status, id]
    );
    if (res.rowCount === 0) return null;
    return this.findById(id);
  },
};

const interviews = {
  async findAll({ driveId, studentId, round, status } = {}) {
    let query = `
      SELECT i.id, i.student_id AS "studentId", i.drive_id AS "driveId",
             i.application_id AS "applicationId", i.round,
             i.scheduled_at AS "scheduledAt", i.mode,
             i.meeting_link AS "meetingLink", i.venue,
             i.status, i.result, i.feedback,
             i.created_at AS "createdAt", i.updated_at AS "updatedAt",
             json_build_object(
               'id', s.id,
               'name', s.name,
               'email', s.email
             ) AS student,
             json_build_object(
               'id', d.id,
               'jobRole', d.job_role
             ) AS drive
      FROM interviews i
      LEFT JOIN students s ON i.student_id = s.id
      LEFT JOIN placement_drives d ON i.drive_id = d.id
      WHERE 1=1
    `;
    const params = [];

    if (driveId) {
      params.push(driveId);
      query += ` AND i.drive_id = $${params.length}`;
    }
    if (studentId) {
      params.push(studentId);
      query += ` AND i.student_id = $${params.length}`;
    }
    if (round) {
      params.push(round);
      query += ` AND i.round = $${params.length}`;
    }
    if (status) {
      params.push(status);
      query += ` AND i.status = $${params.length}`;
    }

    query += ' ORDER BY i.scheduled_at ASC NULLS LAST';
    const res = await pool.query(query, params);
    return res.rows;
  },

  async findById(id) {
    const res = await pool.query(
      `SELECT i.id, i.student_id AS "studentId", i.drive_id AS "driveId",
              i.application_id AS "applicationId", i.round,
              i.scheduled_at AS "scheduledAt", i.mode,
              i.meeting_link AS "meetingLink", i.venue,
              i.status, i.result, i.feedback,
              i.created_at AS "createdAt", i.updated_at AS "updatedAt",
              json_build_object(
                'id', s.id,
                'name', s.name,
                'email', s.email
              ) AS student,
              json_build_object(
                'id', d.id,
                'jobRole', d.job_role
              ) AS drive
       FROM interviews i
       LEFT JOIN students s ON i.student_id = s.id
       LEFT JOIN placement_drives d ON i.drive_id = d.id
       WHERE i.id = $1`,
      [id]
    );
    return res.rows[0] || null;
  },

  async create(data) {
    const id = generateId('int');
    await pool.query(
      `INSERT INTO interviews (id, student_id, drive_id, application_id, round, scheduled_at, mode, meeting_link, venue, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        id,
        data.studentId,
        data.driveId,
        data.applicationId || null,
        data.round,
        data.scheduledAt,
        data.mode || 'online',
        data.meetingLink || null,
        data.venue || null,
        data.status || 'scheduled',
      ]
    );
    return this.findById(id);
  },

  async update(id, updates) {
    const fields = [];
    const values = [];

    const fieldMap = {
      round: 'round',
      scheduledAt: 'scheduled_at',
      mode: 'mode',
      meetingLink: 'meeting_link',
      venue: 'venue',
      status: 'status',
      result: 'result',
      feedback: 'feedback',
    };

    Object.keys(updates).forEach((key) => {
      if (fieldMap[key] && updates[key] !== undefined) {
        values.push(updates[key]);
        fields.push(`${fieldMap[key]} = $${values.length}`);
      }
    });

    if (fields.length === 0) return this.findById(id);

    fields.push(`updated_at = NOW()`);
    values.push(id);

    await pool.query(
      `UPDATE interviews
       SET ${fields.join(', ')}
       WHERE id = $${values.length}`,
      values
    );
    return this.findById(id);
  },

  async delete(id) {
    const res = await pool.query('DELETE FROM interviews WHERE id = $1 RETURNING id', [id]);
    return res.rowCount > 0;
  },

  async updateResult(id, result, feedback) {
    const res = await pool.query(
      `UPDATE interviews
       SET result = $1, feedback = $2, status = 'completed', updated_at = NOW()
       WHERE id = $3
       RETURNING id, student_id AS "studentId", round`,
      [result, feedback || null, id]
    );
    if (res.rowCount === 0) return null;
    return this.findById(id);
  },
};

const notifications = {
  async findAll({ userId, type, read } = {}) {
    let query = `
      SELECT id, user_id AS "userId", type, message, read, created_at AS "createdAt"
      FROM notifications
      WHERE 1=1
    `;
    const params = [];

    if (userId) {
      params.push(userId);
      query += ` AND user_id = $${params.length}`;
    }
    if (type) {
      params.push(type);
      query += ` AND type = $${params.length}`;
    }
    if (read !== undefined) {
      params.push(read === 'true' || read === true);
      query += ` AND read = $${params.length}`;
    }

    query += ' ORDER BY created_at DESC';
    const res = await pool.query(query, params);
    return res.rows;
  },

  async findByUserId(userId) {
    const res = await pool.query(
      `SELECT id, user_id AS "userId", type, message, read, created_at AS "createdAt"
       FROM notifications
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userId]
    );
    return res.rows;
  },

  async create({ userId, type = 'general', message }) {
    const id = generateId('notif');
    const res = await pool.query(
      `INSERT INTO notifications (id, user_id, type, message, read)
       VALUES ($1, $2, $3, $4, FALSE)
       RETURNING id, user_id AS "userId", type, message, read, created_at AS "createdAt"`,
      [id, userId, type, message]
    );
    return res.rows[0];
  },

  async markAsRead(id, userId) {
    const res = await pool.query(
      `UPDATE notifications
       SET read = TRUE
       WHERE id = $1 AND user_id = $2
       RETURNING id, user_id AS "userId", type, message, read, created_at AS "createdAt"`,
      [id, userId]
    );
    return res.rows[0] || null;
  },
};

module.exports = {
  pool,
  query: (text, params) => pool.query(text, params),
  admins,
  students,
  companies,
  trainings,
  placementDrives,
  applications,
  interviews,
  notifications,
  generateId,
};
