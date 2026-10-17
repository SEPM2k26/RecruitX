const { body } = require('express-validator');
const { validate } = require('../middleware/validate.middleware');
const { placementDrives, companies, students, generateId } = require('../config/db');
const { checkStudentEligibility } = require('../services/student-eligibility.service');

// ── Helpers ───────────────────────────────────────────────────────────────────
const enrichDrive = (drive) => {
  const company = companies.find((c) => c.id === drive.companyId);
  return { ...drive, company: company || null };
};

// ── Controllers ───────────────────────────────────────────────────────────────

/**
 * GET /api/admin/drives  |  GET /api/drives  (shared)
 * Query: ?status=active&branch=CSE&companyId=...
 */
const getAllDrives = (req, res) => {
  let result = [...placementDrives];
  const { status, branch, companyId } = req.query;

  if (status) result = result.filter((d) => d.status === status);
  if (companyId) result = result.filter((d) => d.companyId === companyId);
  if (branch) result = result.filter((d) => d.eligibleBranches.includes(branch));

  res.json({ success: true, total: result.length, data: result.map(enrichDrive) });
};

/**
 * GET /api/drives/:id  |  GET /api/admin/drives/:id
 */
const getDriveById = (req, res) => {
  const drive = placementDrives.find((d) => d.id === req.params.id);
  if (!drive) return res.status(404).json({ success: false, message: 'Drive not found' });
  res.json({ success: true, data: enrichDrive(drive) });
};

/**
 * POST /api/admin/drives
 */
const createDrive = [
  body('companyId').notEmpty().withMessage('Company ID required'),
  body('jobRole').trim().notEmpty().withMessage('Job role required'),
  body('package').trim().notEmpty().withMessage('Package required'),
  body('location').trim().notEmpty().withMessage('Location required'),
  body('applicationDeadline').isISO8601().withMessage('Valid deadline required'),
  body('eligibleBranches').isArray({ min: 1 }).withMessage('At least one eligible branch required'),
  body('minCGPA').isFloat({ min: 0, max: 10 }).withMessage('Min CGPA must be 0-10'),
  body('maxBacklogs').isInt({ min: 0 }).withMessage('Max backlogs must be >= 0'),
  body('graduationYear').isInt({ min: 2020 }).withMessage('Valid graduation year required'),
  validate,
  (req, res) => {
    const { companyId, jobRole, package: pkg, location, applicationDeadline,
            eligibleBranches, minCGPA, maxBacklogs, graduationYear, description } = req.body;

    if (!companies.find((c) => c.id === companyId)) {
      return res.status(404).json({ success: false, message: 'Company not found' });
    }

    const newDrive = {
      id: generateId('drive'),
      companyId,
      jobRole,
      package: pkg,
      location,
      applicationDeadline,
      eligibleBranches,
      minCGPA: parseFloat(minCGPA),
      maxBacklogs: parseInt(maxBacklogs),
      graduationYear: parseInt(graduationYear),
      description: description || '',
      status: 'active',
      createdAt: new Date().toISOString(),
    };
    placementDrives.push(newDrive);

    res.status(201).json({ success: true, message: 'Drive created', data: enrichDrive(newDrive) });
  },
];

/**
 * PUT /api/admin/drives/:id
 */
const updateDrive = [
  body('status').optional().isIn(['active', 'closed', 'cancelled']),
  body('minCGPA').optional().isFloat({ min: 0, max: 10 }),
  body('maxBacklogs').optional().isInt({ min: 0 }),
  validate,
  (req, res) => {
    const idx = placementDrives.findIndex((d) => d.id === req.params.id);
    if (idx === -1) return res.status(404).json({ success: false, message: 'Drive not found' });

    const allowed = ['jobRole', 'package', 'location', 'applicationDeadline',
                     'eligibleBranches', 'minCGPA', 'maxBacklogs', 'graduationYear',
                     'description', 'status'];
    allowed.forEach((key) => {
      if (req.body[key] !== undefined) placementDrives[idx][key] = req.body[key];
    });
    placementDrives[idx].updatedAt = new Date().toISOString();

    res.json({ success: true, message: 'Drive updated', data: enrichDrive(placementDrives[idx]) });
  },
];

/**
 * DELETE /api/admin/drives/:id
 */
const deleteDrive = (req, res) => {
  const idx = placementDrives.findIndex((d) => d.id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false, message: 'Drive not found' });
  placementDrives.splice(idx, 1);
  res.json({ success: true, message: 'Drive deleted' });
};

/**
 * GET /api/drives/:id/eligibility  — check if requesting student is eligible
 */
const checkEligibility = (req, res) => {
  const drive = placementDrives.find((d) => d.id === req.params.id);
  if (!drive) return res.status(404).json({ success: false, message: 'Drive not found' });

  const student = students.find((s) => s.id === req.user.id);
  if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

  const result = checkStudentEligibility(student, drive);
  res.json({ success: true, ...result });
};

module.exports = { getAllDrives, getDriveById, createDrive, updateDrive, deleteDrive, checkEligibility };
