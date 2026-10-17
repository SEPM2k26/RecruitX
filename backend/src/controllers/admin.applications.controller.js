const { body } = require('express-validator');
const { validate } = require('../middleware/validate.middleware');
const { applications, placementDrives, students, notifications, generateId } = require('../config/db');
const { checkStudentEligibility } = require('../services/student-eligibility.service');

// Application status flow
const STATUS_FLOW = ['Applied', 'Shortlisted', 'Aptitude', 'Technical Interview', 'HR Interview', 'Selected', 'Rejected'];

// ── Controllers ───────────────────────────────────────────────────────────────

/**
 * GET /api/admin/applications
 * Query: ?driveId=...&status=Applied&studentId=...
 */
const getAllApplications = async (req, res, next) => {
  try {
    const { driveId, status, studentId } = req.query;
    const result = await applications.findAll({ driveId, status, studentId });
    res.json({ success: true, total: result.length, data: result });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/applications/student  — student's own applications
 */
const getMyApplications = async (req, res, next) => {
  try {
    const result = await applications.findAll({ studentId: req.user.id });
    res.json({ success: true, total: result.length, data: result });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/drives/:id/apply  — student applies
 */
const applyForDrive = [
  body('resumeUrl').optional().isURL(),
  validate,
  async (req, res, next) => {
    try {
      const driveId = req.params.id;
      const studentId = req.user.id;

      const drive = placementDrives.find((d) => d.id === driveId);
      if (!drive) return res.status(404).json({ success: false, message: 'Drive not found' });
      if (drive.status !== 'active') return res.status(400).json({ success: false, message: 'Drive is not accepting applications' });

      const student = students.find((s) => s.id === studentId);
      if (!student || student.isActive === false) return res.status(404).json({ success: false, message: 'Student account not found' });

      const duplicate = await applications.findByStudentAndDrive(studentId, driveId);
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

      res.status(201).json({ success: true, message: 'Application submitted', data: newApp });
    } catch (err) {
      next(err);
    }
  },
];

/**
 * PATCH /api/admin/applications/:id/status
 * Body: { status: 'Shortlisted' | 'Aptitude' | ... }
 */
const updateApplicationStatus = [
  body('status').isIn(STATUS_FLOW).withMessage(`Status must be one of: ${STATUS_FLOW.join(', ')}`),
  validate,
  async (req, res, next) => {
    try {
      const app = await applications.findById(req.params.id);
      if (!app) return res.status(404).json({ success: false, message: 'Application not found' });

      const updated = await applications.updateStatus(req.params.id, req.body.status);

      // Push notification to student
      await notifications.create({
        userId: app.studentId,
        type: 'application_status',
        message: `Your application status has been updated to: ${req.body.status}`,
      });

      res.json({ success: true, message: 'Application status updated', data: updated });
    } catch (err) {
      next(err);
    }
  },
];

/**
 * PATCH /api/admin/applications/:id/shortlist
 */
const shortlistApplication = async (req, res, next) => {
  try {
    const app = await applications.findById(req.params.id);
    if (!app) return res.status(404).json({ success: false, message: 'Application not found' });

    const updated = await applications.updateStatus(req.params.id, 'Shortlisted');

    await notifications.create({
      userId: app.studentId,
      type: 'shortlisted',
      message: 'Congratulations! You have been shortlisted.',
    });

    res.json({ success: true, message: 'Student shortlisted', data: updated });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/admin/applications/:id/reject
 */
const rejectApplication = async (req, res, next) => {
  try {
    const app = await applications.findById(req.params.id);
    if (!app) return res.status(404).json({ success: false, message: 'Application not found' });

    const updated = await applications.updateStatus(req.params.id, 'Rejected');

    await notifications.create({
      userId: app.studentId,
      type: 'rejected',
      message: 'Your application has been rejected.',
    });

    res.json({ success: true, message: 'Application rejected', data: updated });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAllApplications,
  getMyApplications,
  applyForDrive,
  updateApplicationStatus,
  shortlistApplication,
  rejectApplication,
};
