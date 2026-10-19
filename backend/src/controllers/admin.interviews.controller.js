const { body } = require('express-validator');
const { validate } = require('../middleware/validate.middleware');
const { interviews, students, placementDrives, notifications } = require('../config/db');

// ── Controllers ───────────────────────────────────────────────────────────────

/**
 * GET /api/admin/interviews
 * Query: ?driveId=...&studentId=...&round=...&status=...
 */
const getAllInterviews = async (req, res, next) => {
  try {
    const { driveId, studentId, round, status } = req.query;
    const result = await interviews.findAll({ driveId, studentId, round, status });
    res.json({ success: true, total: result.length, data: result });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/interviews/student  — student's own interviews
 */
const getMyInterviews = async (req, res, next) => {
  try {
    const result = await interviews.findAll({ studentId: req.user.id });
    res.json({ success: true, total: result.length, data: result });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/admin/interviews/:id
 */
const getInterviewById = async (req, res, next) => {
  try {
    const interview = await interviews.findById(req.params.id);
    if (!interview) return res.status(404).json({ success: false, message: 'Interview not found' });
    res.json({ success: true, data: interview });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/admin/interviews
 */
const createInterview = [
  body('studentId').notEmpty().withMessage('Student ID required'),
  body('driveId').notEmpty().withMessage('Drive ID required'),
  body('round').isIn(['Aptitude', 'Technical Interview', 'HR Interview', 'Group Discussion']).withMessage('Invalid round'),
  body('scheduledAt').isISO8601().withMessage('Valid scheduled date required'),
  body('mode').isIn(['online', 'offline']).withMessage('Mode: online|offline'),
  validate,
  async (req, res, next) => {
    try {
      const { studentId, driveId, applicationId, round, scheduledAt, mode, meetingLink, venue } = req.body;

      const student = await students.findById(studentId);
      if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

      const drive = await placementDrives.findById(driveId);
      if (!drive) return res.status(404).json({ success: false, message: 'Drive not found' });

      const newInterview = await interviews.create({
        studentId,
        driveId,
        applicationId: applicationId || null,
        round,
        scheduledAt,
        mode,
        meetingLink: meetingLink || null,
        venue: venue || null,
        status: 'scheduled',
      });

      // Notify student
      await notifications.create({
        userId: studentId,
        type: 'interview_scheduled',
        message: `You have been scheduled for ${round} on ${new Date(scheduledAt).toLocaleDateString()}`,
      });

      res.status(201).json({ success: true, message: 'Interview scheduled', data: newInterview });
    } catch (err) {
      next(err);
    }
  },
];

/**
 * PUT /api/admin/interviews/:id
 */
const updateInterview = [
  body('round').optional().isIn(['Aptitude', 'Technical Interview', 'HR Interview', 'Group Discussion']),
  body('mode').optional().isIn(['online', 'offline']),
  body('status').optional().isIn(['scheduled', 'completed', 'cancelled']),
  body('result').optional().isIn(['passed', 'failed', 'pending']),
  validate,
  async (req, res, next) => {
    try {
      const existing = await interviews.findById(req.params.id);
      if (!existing) return res.status(404).json({ success: false, message: 'Interview not found' });

      const allowed = ['round', 'scheduledAt', 'mode', 'meetingLink', 'venue', 'status', 'result', 'feedback'];
      const updates = {};
      allowed.forEach((key) => {
        if (req.body[key] !== undefined) updates[key] = req.body[key];
      });

      const updated = await interviews.update(req.params.id, updates);
      res.json({ success: true, message: 'Interview updated', data: updated });
    } catch (err) {
      next(err);
    }
  },
];

/**
 * DELETE /api/admin/interviews/:id
 */
const deleteInterview = async (req, res, next) => {
  try {
    const existing = await interviews.findById(req.params.id);
    if (!existing) return res.status(404).json({ success: false, message: 'Interview not found' });

    await interviews.delete(req.params.id);
    res.json({ success: true, message: 'Interview deleted' });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/admin/interviews/:id/result
 * Body: { result: 'passed'|'failed', feedback: '...' }
 */
const updateResult = [
  body('result').isIn(['passed', 'failed', 'pending']).withMessage('Result must be: passed|failed|pending'),
  validate,
  async (req, res, next) => {
    try {
      const interview = await interviews.findById(req.params.id);
      if (!interview) return res.status(404).json({ success: false, message: 'Interview not found' });

      const updated = await interviews.updateResult(req.params.id, req.body.result, req.body.feedback);

      await notifications.create({
        userId: interview.studentId,
        type: 'interview_result',
        message: `Your ${interview.round} result: ${req.body.result.toUpperCase()}`,
      });

      res.json({ success: true, message: 'Result updated', data: updated });
    } catch (err) {
      next(err);
    }
  },
];

module.exports = {
  getAllInterviews,
  getMyInterviews,
  getInterviewById,
  createInterview,
  updateInterview,
  deleteInterview,
  updateResult,
};
