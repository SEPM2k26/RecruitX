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
const getAllDrives = async (req, res, next) => {
  try {
    const { status, branch, companyId } = req.query;
    const result = await placementDrives.findAll({ status, branch, companyId });
    res.json({ success: true, total: result.length, data: result });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/drives/:id  |  GET /api/admin/drives/:id
 */
const getDriveById = async (req, res, next) => {
  try {
    const drive = await placementDrives.findById(req.params.id);
    if (!drive) return res.status(404).json({ success: false, message: 'Drive not found' });
    res.json({ success: true, data: drive });
  } catch (err) {
    next(err);
  }
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
  async (req, res, next) => {
    try {
      const {
        companyId,
        jobRole,
        package: pkg,
        location,
        applicationDeadline,
        eligibleBranches,
        minCGPA,
        maxBacklogs,
        graduationYear,
        description,
      } = req.body;

      const company = await companies.findById(companyId);
      if (!company) {
        return res.status(404).json({ success: false, message: 'Company not found' });
      }

      const newDrive = await placementDrives.create({
        companyId,
        jobRole,
        package: pkg,
        location,
        applicationDeadline,
        eligibleBranches,
        minCGPA,
        maxBacklogs,
        graduationYear,
        description,
        status: 'active',
      });

      res.status(201).json({ success: true, message: 'Drive created', data: newDrive });
    } catch (err) {
      next(err);
    }
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
  async (req, res, next) => {
    try {
      const existing = await placementDrives.findById(req.params.id);
      if (!existing) return res.status(404).json({ success: false, message: 'Drive not found' });

      const allowed = [
        'jobRole',
        'package',
        'location',
        'applicationDeadline',
        'eligibleBranches',
        'minCGPA',
        'maxBacklogs',
        'graduationYear',
        'description',
        'status',
      ];
      const updates = {};
      allowed.forEach((key) => {
        if (req.body[key] !== undefined) updates[key] = req.body[key];
      });

      const updated = await placementDrives.update(req.params.id, updates);
      res.json({ success: true, message: 'Drive updated', data: updated });
    } catch (err) {
      next(err);
    }
  },
];

/**
 * DELETE /api/admin/drives/:id
 */
const deleteDrive = async (req, res, next) => {
  try {
    const existing = await placementDrives.findById(req.params.id);
    if (!existing) return res.status(404).json({ success: false, message: 'Drive not found' });

    await placementDrives.delete(req.params.id);
    res.json({ success: true, message: 'Drive deleted' });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/drives/:id/eligibility  — check if requesting student is eligible
 */
const checkEligibility = async (req, res, next) => {
  try {
    const drive = await placementDrives.findById(req.params.id);
    if (!drive) return res.status(404).json({ success: false, message: 'Drive not found' });

    const student = await students.findById(req.user.id);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

    const eligibleBranches = Array.isArray(drive.eligibleBranches) ? drive.eligibleBranches : [];
    const checks = {
      cgpa: student.cgpa >= drive.minCGPA,
      backlogs: student.backlogs <= drive.maxBacklogs,
      branch: eligibleBranches.includes(student.branch),
      graduationYear: student.graduationYear === drive.graduationYear,
    };

    const eligible = Object.values(checks).every(Boolean);
    res.json({ success: true, eligible, checks });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAllDrives, getDriveById, createDrive, updateDrive, deleteDrive, checkEligibility };
