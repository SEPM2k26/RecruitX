const { randomUUID } = require('crypto');
const { body } = require('express-validator');
const { validate } = require('../middleware/validate.middleware');
const prisma = require('../lib/prisma');
const { DRIVE_STATUS, loadRecruiter, serializeDrive } = require('../services/recruiter.context');

/** GET /api/recruiter/drives */
const listDrives = async (req, res, next) => {
  try {
    const recruiter = await loadRecruiter(req);
    if (!recruiter) return res.status(404).json({ success: false, message: 'Recruiter account not found' });
    const where = { companyId: recruiter.companyId };
    if (req.query.status) where.status = req.query.status;
    const drives = await prisma.placementDrive.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { applications: true } } },
    });
    res.json({ success: true, total: drives.length, data: drives.map(serializeDrive) });
  } catch (err) {
    next(err);
  }
};

const createDriveRules = [
  body('jobRole').trim().notEmpty().withMessage('Job role required'),
  body('package').trim().notEmpty().withMessage('Package required'),
  body('location').trim().notEmpty().withMessage('Location required'),
  body('applicationDeadline').optional().trim().notEmpty().withMessage('Deadline required'),
  body('eligibleBranches').isArray({ min: 1 }).withMessage('At least one eligible branch required'),
  body('minCGPA').optional().isFloat({ min: 0, max: 10 }).withMessage('Min CGPA must be 0-10'),
  body('maxBacklogs').optional().isInt({ min: 0 }).withMessage('Max backlogs must be >= 0'),
  body('graduationYear').optional().isInt({ min: 2020 }).withMessage('Valid graduation year required'),
  body('description').optional().trim(),
  body('driveType').optional().isIn(['placement', 'internship']).withMessage('driveType must be placement or internship'),
  body('status').optional().isIn(DRIVE_STATUS).withMessage('Invalid drive status'),
];

/** POST /api/recruiter/drives — companyId is forced to the recruiter's company. */
const createDrive = [
  ...createDriveRules,
  validate,
  async (req, res, next) => {
    try {
      const recruiter = await loadRecruiter(req);
      if (!recruiter) return res.status(404).json({ success: false, message: 'Recruiter account not found' });
      const { jobRole, package: pkg, location, applicationDeadline, eligibleBranches,
              minCGPA, maxBacklogs, graduationYear, description, status, driveType } = req.body;
      const drive = await prisma.placementDrive.create({
        data: {
          id: `drive-${randomUUID().slice(0, 8)}`,
          companyId: recruiter.companyId,
          jobRole,
          package: pkg,
          location,
          applicationDeadline: applicationDeadline || null,
          eligibleBranches,
          minCGPA: minCGPA === undefined ? 0 : parseFloat(minCGPA),
          maxBacklogs: maxBacklogs === undefined ? 0 : parseInt(maxBacklogs, 10),
          graduationYear: graduationYear === undefined ? null : parseInt(graduationYear, 10),
          description: description || null,
          status: status || 'active',
          driveType: driveType || 'placement',
        },
      });
      res.status(201).json({ success: true, message: 'Drive created', data: serializeDrive(drive) });
    } catch (err) {
      next(err);
    }
  },
];

/** GET /api/recruiter/drives/:id */
const getDriveById = async (req, res, next) => {
  try {
    const recruiter = await loadRecruiter(req);
    if (!recruiter) return res.status(404).json({ success: false, message: 'Recruiter account not found' });
    const drive = await prisma.placementDrive.findUnique({ where: { id: req.params.id } });
    if (!drive || drive.companyId !== recruiter.companyId) {
      return res.status(404).json({ success: false, message: 'Drive not found' });
    }
    res.json({ success: true, data: serializeDrive(drive) });
  } catch (err) {
    next(err);
  }
};

/** PUT /api/recruiter/drives/:id */
const updateDrive = [
  ...createDriveRules.map((rule) => rule.optional()),
  validate,
  async (req, res, next) => {
    try {
      const recruiter = await loadRecruiter(req);
      if (!recruiter) return res.status(404).json({ success: false, message: 'Recruiter account not found' });
      const drive = await prisma.placementDrive.findUnique({ where: { id: req.params.id } });
      if (!drive || drive.companyId !== recruiter.companyId) {
        return res.status(404).json({ success: false, message: 'Drive not found' });
      }
      const { jobRole, package: pkg, location, applicationDeadline, eligibleBranches,
              minCGPA, maxBacklogs, graduationYear, description, status, driveType } = req.body;
      const data = {};
      if (jobRole !== undefined) data.jobRole = jobRole;
      if (pkg !== undefined) data.package = pkg;
      if (location !== undefined) data.location = location;
      if (applicationDeadline !== undefined) data.applicationDeadline = applicationDeadline || null;
      if (eligibleBranches !== undefined) data.eligibleBranches = eligibleBranches;
      if (minCGPA !== undefined) data.minCGPA = parseFloat(minCGPA);
      if (maxBacklogs !== undefined) data.maxBacklogs = parseInt(maxBacklogs, 10);
      if (graduationYear !== undefined) data.graduationYear = parseInt(graduationYear, 10);
      if (description !== undefined) data.description = description || null;
      if (status !== undefined) data.status = status;
      if (driveType !== undefined) data.driveType = driveType;
      const updated = await prisma.placementDrive.update({ where: { id: drive.id }, data });
      res.json({ success: true, message: 'Drive updated', data: serializeDrive(updated) });
    } catch (err) {
      next(err);
    }
  },
];

/** PATCH /api/recruiter/drives/:id/status */
const updateDriveStatus = [
  body('status').isIn(DRIVE_STATUS).withMessage('Invalid drive status'),
  validate,
  async (req, res, next) => {
    try {
      const recruiter = await loadRecruiter(req);
      if (!recruiter) return res.status(404).json({ success: false, message: 'Recruiter account not found' });
      const drive = await prisma.placementDrive.findUnique({ where: { id: req.params.id } });
      if (!drive || drive.companyId !== recruiter.companyId) {
        return res.status(404).json({ success: false, message: 'Drive not found' });
      }
      const updated = await prisma.placementDrive.update({
        where: { id: drive.id },
        data: { status: req.body.status },
      });
      res.json({ success: true, message: 'Drive status updated', data: serializeDrive(updated) });
    } catch (err) {
      next(err);
    }
  },
];

/** DELETE /api/recruiter/drives/:id (FK cascade removes its applications) */
const deleteDrive = async (req, res, next) => {
  try {
    const recruiter = await loadRecruiter(req);
    if (!recruiter) return res.status(404).json({ success: false, message: 'Recruiter account not found' });
    const drive = await prisma.placementDrive.findUnique({ where: { id: req.params.id } });
    if (!drive || drive.companyId !== recruiter.companyId) {
      return res.status(404).json({ success: false, message: 'Drive not found' });
    }
    await prisma.placementDrive.delete({ where: { id: drive.id } });
    res.json({ success: true, message: 'Drive deleted' });
  } catch (err) {
    next(err);
  }
};

module.exports = { listDrives, createDrive, getDriveById, updateDrive, updateDriveStatus, deleteDrive };
