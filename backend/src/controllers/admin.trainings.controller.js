const { body } = require('express-validator');
const { validate } = require('../middleware/validate.middleware');
const { trainings, generateId } = require('../config/db');

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
  (req, res) => {
    const { title, description, instructor, startDate, endDate, duration, mode, maxStudents } = req.body;

    const newTraining = {
      id: generateId('train'),
      title,
      description: description || '',
      instructor,
      startDate,
      endDate,
      duration: duration || null,
      mode,
      maxStudents: parseInt(maxStudents),
      status: 'upcoming',
      enrolledStudents: [],
      createdAt: new Date().toISOString(),
    };
    trainings.push(newTraining);

    res.status(201).json({ success: true, message: 'Training created', data: newTraining });
  },
];

/**
 * PUT /api/admin/trainings/:id
 */
const updateTraining = [
  body('title').optional().trim().notEmpty(),
  body('status').optional().isIn(['upcoming', 'active', 'completed', 'cancelled']),
  validate,
  (req, res) => {
    const idx = trainings.findIndex((t) => t.id === req.params.id);
    if (idx === -1) return res.status(404).json({ success: false, message: 'Training not found' });

    const allowed = ['title', 'description', 'instructor', 'startDate', 'endDate', 'duration', 'mode', 'maxStudents', 'status'];
    allowed.forEach((key) => {
      if (req.body[key] !== undefined) trainings[idx][key] = req.body[key];
    });
    trainings[idx].updatedAt = new Date().toISOString();

    res.json({ success: true, message: 'Training updated', data: trainings[idx] });
  },
];

/**
 * DELETE /api/admin/trainings/:id
 */
const deleteTraining = (req, res) => {
  const idx = trainings.findIndex((t) => t.id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false, message: 'Training not found' });
  trainings.splice(idx, 1);
  res.json({ success: true, message: 'Training deleted' });
};

/**
 * GET /api/admin/trainings/:id/enrollments
 * Returns enrolled student IDs (Person 3 would join with students table)
 */
const getEnrollments = (req, res) => {
  const training = trainings.find((t) => t.id === req.params.id);
  if (!training) return res.status(404).json({ success: false, message: 'Training not found' });
  res.json({ success: true, enrolledStudents: training.enrolledStudents });
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
