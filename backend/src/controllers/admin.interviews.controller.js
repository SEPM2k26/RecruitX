const { body } = require('express-validator');
const { validate } = require('../middleware/validate.middleware');
const { interviews, applications, students, placementDrives, notifications, generateId } = require('../config/db');

// ── Helpers ───────────────────────────────────────────────────────────────────
const enrichInterview = (interview) => {
  const student = students.find((s) => s.id === interview.studentId);
  const drive = placementDrives.find((d) => d.id === interview.driveId);
  return {
    ...interview,
    student: student ? { id: student.id, name: student.name, email: student.email } : null,
    drive: drive ? { id: drive.id, jobRole: drive.jobRole } : null,
  };
};

// ── Controllers ───────────────────────────────────────────────────────────────

/**
 * GET /api/admin/interviews
 * Query: ?driveId=...&studentId=...&round=...&status=...
 */
const getAllInterviews = (req, res) => {
  let result = [...interviews];
  const { driveId, studentId, round, status } = req.query;

  if (driveId) result = result.filter((i) => i.driveId === driveId);
  if (studentId) result = result.filter((i) => i.studentId === studentId);
  if (round) result = result.filter((i) => i.round === round);
  if (status) result = result.filter((i) => i.status === status);

  res.json({ success: true, total: result.length, data: result.map(enrichInterview) });
};

/**
 * GET /api/interviews/student  — student's own interviews
 */
const getMyInterviews = (req, res) => {
  const result = interviews.filter((i) => i.studentId === req.user.id);
  res.json({ success: true, total: result.length, data: result.map(enrichInterview) });
};

/**
 * GET /api/admin/interviews/:id
 */
const getInterviewById = (req, res) => {
  const interview = interviews.find((i) => i.id === req.params.id);
  if (!interview) return res.status(404).json({ success: false, message: 'Interview not found' });
  res.json({ success: true, data: enrichInterview(interview) });
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
  (req, res) => {
    const { studentId, driveId, applicationId, round, scheduledAt, mode, meetingLink, venue } = req.body;

    if (!students.find((s) => s.id === studentId)) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }
    if (!placementDrives.find((d) => d.id === driveId)) {
      return res.status(404).json({ success: false, message: 'Drive not found' });
    }

    const newInterview = {
      id: generateId('int'),
      studentId,
      driveId,
      applicationId: applicationId || null,
      round,
      scheduledAt,
      mode,
      meetingLink: meetingLink || null,
      venue: venue || null,
      status: 'scheduled',
      result: null,
      feedback: null,
      createdAt: new Date().toISOString(),
    };
    interviews.push(newInterview);

    // Notify student
    notifications.push({
      id: generateId('notif'),
      userId: studentId,
      type: 'interview_scheduled',
      message: `You have been scheduled for ${round} on ${new Date(scheduledAt).toLocaleDateString()}`,
      read: false,
      createdAt: new Date().toISOString(),
    });

    res.status(201).json({ success: true, message: 'Interview scheduled', data: enrichInterview(newInterview) });
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
  (req, res) => {
    const idx = interviews.findIndex((i) => i.id === req.params.id);
    if (idx === -1) return res.status(404).json({ success: false, message: 'Interview not found' });

    const allowed = ['round', 'scheduledAt', 'mode', 'meetingLink', 'venue', 'status', 'result', 'feedback'];
    allowed.forEach((key) => {
      if (req.body[key] !== undefined) interviews[idx][key] = req.body[key];
    });
    interviews[idx].updatedAt = new Date().toISOString();

    res.json({ success: true, message: 'Interview updated', data: enrichInterview(interviews[idx]) });
  },
];

/**
 * DELETE /api/admin/interviews/:id
 */
const deleteInterview = (req, res) => {
  const idx = interviews.findIndex((i) => i.id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false, message: 'Interview not found' });
  interviews.splice(idx, 1);
  res.json({ success: true, message: 'Interview deleted' });
};

/**
 * PATCH /api/admin/interviews/:id/result
 * Body: { result: 'passed'|'failed', feedback: '...' }
 */
const updateResult = [
  body('result').isIn(['passed', 'failed', 'pending']).withMessage('Result must be: passed|failed|pending'),
  validate,
  (req, res) => {
    const interview = interviews.find((i) => i.id === req.params.id);
    if (!interview) return res.status(404).json({ success: false, message: 'Interview not found' });

    interview.result = req.body.result;
    interview.feedback = req.body.feedback || null;
    interview.status = 'completed';
    interview.updatedAt = new Date().toISOString();

    notifications.push({
      id: generateId('notif'),
      userId: interview.studentId,
      type: 'interview_result',
      message: `Your ${interview.round} result: ${req.body.result.toUpperCase()}`,
      read: false,
      createdAt: new Date().toISOString(),
    });

    res.json({ success: true, message: 'Result updated', data: enrichInterview(interview) });
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
