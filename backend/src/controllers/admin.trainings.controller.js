const { body } = require('express-validator');
const { validate } = require('../middleware/validate.middleware');
const { trainings } = require('../config/db');

// ── Controllers ───────────────────────────────────────────────────────────────

/**
 * GET /api/admin/trainings
 */
const getAllTrainings = async (req, res, next) => {
  try {
    const { status } = req.query;
    const result = await trainings.findAll({ status });
    res.json({ success: true, total: result.length, data: result });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/trainings (shared public)
 */
const getPublicTrainings = async (req, res, next) => {
  try {
    const { status } = req.query;
    const result = await trainings.findAll({ status });
    const data = result.map(({ enrolledStudents, ...training }) => {
      const enrolled = Array.isArray(enrolledStudents) ? enrolledStudents : [];
      return {
        ...training,
        enrolledCount: enrolled.length,
      };
    });
    res.json({ success: true, total: data.length, data });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/admin/trainings/:id
 */
const getTrainingById = async (req, res, next) => {
  try {
    const training = await trainings.findById(req.params.id);
    if (!training) return res.status(404).json({ success: false, message: 'Training not found' });
    res.json({ success: true, data: training });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/trainings/:id (public detail)
 */
const getPublicTrainingById = async (req, res, next) => {
  try {
    const training = await trainings.findById(req.params.id);
    if (!training) return res.status(404).json({ success: false, message: 'Training not found' });
    const { enrolledStudents, ...data } = training;
    const enrolled = Array.isArray(enrolledStudents) ? enrolledStudents : [];
    return res.json({ success: true, data: { ...data, enrolledCount: enrolled.length } });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/trainings/student — current student's enrolled programs
 */
const getMyTrainings = async (req, res, next) => {
  try {
    const all = await trainings.findAll();
    const result = all
      .filter((t) => Array.isArray(t.enrolledStudents) && t.enrolledStudents.includes(req.user.id))
      .map(({ enrolledStudents, ...t }) => ({
        ...t,
        enrolledCount: enrolledStudents.length,
        enrollmentStatus: 'Enrolled',
      }));
    res.json({ success: true, total: result.length, data: result });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/admin/trainings
 */
const createTraining = [
  body('title').trim().notEmpty().withMessage('Title required'),
  body('instructor').trim().notEmpty().withMessage('Instructor required'),
  body('startDate').isISO8601().withMessage('Valid start date required'),
  body('endDate').isISO8601().withMessage('Valid end date required'),
  body('maxStudents').isInt({ min: 1 }).withMessage('Max students must be > 0'),
  body('mode').isIn(['online', 'offline', 'hybrid']).withMessage('Mode: online|offline|hybrid'),
  validate,
  async (req, res, next) => {
    try {
      const { title, description, instructor, startDate, endDate, duration, mode, maxStudents } = req.body;

      const newTraining = await trainings.create({
        title,
        description,
        instructor,
        startDate,
        endDate,
        duration,
        mode,
        maxStudents: parseInt(maxStudents, 10),
      });

      res.status(201).json({ success: true, message: 'Training created', data: newTraining });
    } catch (err) {
      next(err);
    }
  },
];

/**
 * PUT /api/admin/trainings/:id
 */
const updateTraining = [
  body('title').optional().trim().notEmpty(),
  body('status').optional().isIn(['upcoming', 'active', 'completed', 'cancelled']),
  validate,
  async (req, res, next) => {
    try {
      const existing = await trainings.findById(req.params.id);
      if (!existing) return res.status(404).json({ success: false, message: 'Training not found' });

      const allowed = ['title', 'description', 'instructor', 'startDate', 'endDate', 'duration', 'mode', 'maxStudents', 'status'];
      const updates = {};
      allowed.forEach((key) => {
        if (req.body[key] !== undefined) updates[key] = req.body[key];
      });

      const updated = await trainings.update(req.params.id, updates);
      res.json({ success: true, message: 'Training updated', data: updated });
    } catch (err) {
      next(err);
    }
  },
];

/**
 * DELETE /api/admin/trainings/:id
 */
const deleteTraining = async (req, res, next) => {
  try {
    const existing = await trainings.findById(req.params.id);
    if (!existing) return res.status(404).json({ success: false, message: 'Training not found' });

    await trainings.delete(req.params.id);
    res.json({ success: true, message: 'Training deleted' });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/admin/trainings/:id/enrollments
 */
const getEnrollments = async (req, res, next) => {
  try {
    const training = await trainings.findById(req.params.id);
    if (!training) return res.status(404).json({ success: false, message: 'Training not found' });
    res.json({ success: true, enrolledStudents: training.enrolledStudents || [] });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/trainings/:id/enroll  (student-facing — shared endpoint)
 */
const enrollStudent = async (req, res, next) => {
  try {
    const training = await trainings.findById(req.params.id);
    if (!training) return res.status(404).json({ success: false, message: 'Training not found' });

    if (['completed', 'cancelled'].includes(training.status)) {
      return res.status(400).json({ success: false, message: 'This training is no longer accepting enrollments.' });
    }

    const result = await trainings.enroll(req.params.id, req.user.id);
    if (result.error) {
      return res.status(result.code).json({ success: false, message: result.error });
    }

    const enrolled = result.data?.enrolledStudents || [];
    res.json({
      success: true,
      message: 'Enrolled successfully',
      data: { ...result.data, enrolled: true, enrolledCount: enrolled.length },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAllTrainings,
  getPublicTrainings,
  getTrainingById,
  getPublicTrainingById,
  getMyTrainings,
  createTraining,
  updateTraining,
  deleteTraining,
  getEnrollments,
  enrollStudent,
};
