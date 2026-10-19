const { body } = require('express-validator');
const { validate } = require('../middleware/validate.middleware');
const { notifications, students } = require('../config/db');

// ── Controllers ───────────────────────────────────────────────────────────────

/**
 * GET /api/admin/notifications
 * Admin views all or filtered notifications
 */
const getAllNotifications = async (req, res, next) => {
  try {
    const { userId, type, read } = req.query;
    const result = await notifications.findAll({ userId, type, read });
    res.json({ success: true, total: result.length, data: result });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/notifications/me — student's own notifications
 */
const getMyNotifications = async (req, res, next) => {
  try {
    const result = await notifications.findByUserId(req.user.id);
    res.json({ success: true, total: result.length, data: result });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/notifications/:id/read
 */
const markAsRead = async (req, res, next) => {
  try {
    const updated = await notifications.markAsRead(req.params.id, req.user.id);
    if (!updated) return res.status(404).json({ success: false, message: 'Notification not found' });
    res.json({ success: true, message: 'Marked as read', data: updated });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/admin/notifications  — admin sends a notification
 */
const createNotification = [
  body('userId').notEmpty().withMessage('User ID required'),
  body('message').trim().notEmpty().withMessage('Message required'),
  body('type')
    .isIn([
      'general',
      'drive_announcement',
      'interview_scheduled',
      'application_status',
      'shortlisted',
      'rejected',
      'interview_result',
    ])
    .withMessage('Invalid type'),
  validate,
  async (req, res, next) => {
    try {
      const { userId, message, type } = req.body;
      const newNotif = await notifications.create({ userId, message, type });
      res.status(201).json({ success: true, message: 'Notification sent', data: newNotif });
    } catch (err) {
      next(err);
    }
  },
];

/**
 * POST /api/admin/notifications/broadcast — send to all or filtered group
 * Body: { message, type, branch?, graduationYear? }
 */
const broadcastNotification = [
  body('message').trim().notEmpty().withMessage('Message required'),
  body('type').notEmpty().withMessage('Type required'),
  validate,
  async (req, res, next) => {
    try {
      const { message, type, branch, graduationYear } = req.body;
      const targetStudents = await students.findAll({ branch, graduationYear });

      const created = await Promise.all(
        targetStudents.map((s) =>
          notifications.create({
            userId: s.id,
            type,
            message,
          })
        )
      );

      res.status(201).json({
        success: true,
        message: `Broadcast sent to ${created.length} students`,
        count: created.length,
      });
    } catch (err) {
      next(err);
    }
  },
];

module.exports = {
  getAllNotifications,
  getMyNotifications,
  markAsRead,
  createNotification,
  broadcastNotification,
};
