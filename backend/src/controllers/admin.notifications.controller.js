const { body } = require('express-validator');
const { validate } = require('../middleware/validate.middleware');
const { notifications, generateId } = require('../config/db');

// ── Controllers ───────────────────────────────────────────────────────────────

/**
 * GET /api/admin/notifications
 * Admin views all or filtered notifications
 */
const getAllNotifications = (req, res) => {
  const { userId, type, read } = req.query;
  let result = [...notifications];

  if (userId) result = result.filter((n) => n.userId === userId);
  if (type) result = result.filter((n) => n.type === type);
  if (read !== undefined) result = result.filter((n) => n.read === (read === 'true'));

  res.json({ success: true, total: result.length, data: result });
};

/**
 * GET /api/notifications/me — student's own notifications
 */
const getMyNotifications = (req, res) => {
  const result = notifications
    .filter((n) => n.userId === req.user.id)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  res.json({ success: true, total: result.length, data: result });
};

/**
 * PATCH /api/notifications/:id/read
 */
const markAsRead = (req, res) => {
  const notif = notifications.find((n) => n.id === req.params.id && n.userId === req.user.id);
  if (!notif) return res.status(404).json({ success: false, message: 'Notification not found' });

  notif.read = true;
  res.json({ success: true, message: 'Marked as read', data: notif });
};

/**
 * POST /api/admin/notifications  — admin broadcasts a notification
 */
const createNotification = [
  body('userId').notEmpty().withMessage('User ID required'),
  body('message').trim().notEmpty().withMessage('Message required'),
  body('type').isIn(['general', 'drive_announcement', 'interview_scheduled', 'application_status', 'shortlisted', 'rejected', 'interview_result']).withMessage('Invalid type'),
  validate,
  (req, res) => {
    const { userId, message, type } = req.body;

    const newNotif = {
      id: generateId('notif'),
      userId,
      type,
      message,
      read: false,
      createdAt: new Date().toISOString(),
    };
    notifications.push(newNotif);

    res.status(201).json({ success: true, message: 'Notification sent', data: newNotif });
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
  (req, res) => {
    const { students } = require('../config/db');
    const { message, type, branch, graduationYear } = req.body;

    let targetStudents = [...students];
    if (branch) targetStudents = targetStudents.filter((s) => s.branch === branch);
    if (graduationYear) targetStudents = targetStudents.filter((s) => s.graduationYear === parseInt(graduationYear));

    const created = targetStudents.map((s) => {
      const notif = {
        id: generateId('notif'),
        userId: s.id,
        type,
        message,
        read: false,
        createdAt: new Date().toISOString(),
      };
      notifications.push(notif);
      return notif;
    });

    res.status(201).json({
      success: true,
      message: `Broadcast sent to ${created.length} students`,
      count: created.length,
    });
  },
];

module.exports = {
  getAllNotifications,
  getMyNotifications,
  markAsRead,
  createNotification,
  broadcastNotification,
};
