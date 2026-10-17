const { body } = require('express-validator');
const { validate } = require('../middleware/validate.middleware');
const { trainings } = require('../config/db');

// ── Controllers ───────────────────────────────────────────────────────────────

/**
 * GET /api/admin/trainings  |  GET /api/trainings (shared)
 */
const getAllTrainings = (req, res) => {
  const { status } = req.query;
  let result = [...trainings];
  if (status) result = result.filter((t) => t.status === status);
  res.json({ success: true, total: result.length, data: result });
};

const getPublicTrainings = (req, res) => {
  const { status } = req.query;
  let result = [...trainings];
  if (status) result = result.filter((training) => training.status === status);
  const data = result.map(({ enrolledStudents, ...training }) => ({
    ...training,
    enrolledCount: enrolledStudents.length,
  }));
  res.json({ success: true, total: data.length, data });
};

/**
 * GET /api/admin/trainings/:id
 */
const getTrainingById = (req, res) => {
  const training = trainings.find((t) => t.id === req.params.id);
  if (!training) return res.status(404).json({ success: false, message: 'Training not found' });
  res.json({ success: true, data: training });
};

const getPublicTrainingById = (req, res) => {
  const training = trainings.find((item) => item.id === req.params.id);
  if (!training) return res.status(404).json({ success: false, message: 'Training not found' });
  const { enrolledStudents, ...data } = training;
  return res.json({ success: true, data: { ...data, enrolledCount: enrolledStudents.length } });
};

/**
 * GET /api/trainings/student — current student's enrolled programs
 */
const getMyTrainings = (req, res) => {
  const result = trainings
    .filter((training) => training.enrolledStudents.includes(req.user.id))
    .map(({ enrolledStudents, ...training }) => ({
      ...training,
      enrolledCount: enrolledStudents.length,
      enrollmentStatus: 'Enrolled',
    }));
  res.json({ success: true, total: result.length, data: result });
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
const enrollStudent = (req, res) => {
  const training = trainings.find((t) => t.id === req.params.id);
  if (!training) return res.status(404).json({ success: false, message: 'Training not found' });
  if (['completed', 'cancelled'].includes(training.status)) {
    return res.status(400).json({ success: false, message: 'This training is no longer accepting enrollments.' });
  }

  const studentId = req.user.id;

  if (training.enrolledStudents.includes(studentId)) {
    return res.status(409).json({ success: false, message: 'Already enrolled' });
  }
  if (training.enrolledStudents.length >= training.maxStudents) {
    return res.status(400).json({ success: false, message: 'Training is full' });
  }

  training.enrolledStudents.push(studentId);
  const { enrolledStudents, ...safeTraining } = training;
  res.json({
    success: true,
    message: 'Enrolled successfully',
    data: { ...safeTraining, enrolled: true, enrolledCount: enrolledStudents.length },
  });
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
