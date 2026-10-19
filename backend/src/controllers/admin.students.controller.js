const { body } = require('express-validator');
const { validate } = require('../middleware/validate.middleware');
const { students } = require('../config/db');

// ── Helpers ───────────────────────────────────────────────────────────────────
const safeStudent = ({ password, resumeStoragePath, resumeMimeType, resumeSize, ...rest }) => rest;

// ── Controllers ───────────────────────────────────────────────────────────────

/**
 * GET /api/admin/students
 * Query: ?search=name&branch=CSE&graduationYear=2025&isActive=true
 */
const getAllStudents = async (req, res, next) => {
  try {
    const { search, branch, graduationYear, isActive } = req.query;
    const result = await students.findAll({ search, branch, graduationYear, isActive });

    res.json({
      success: true,
      total: result.length,
      data: result.map(safeStudent),
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/admin/students/:id
 */
const getStudentById = async (req, res, next) => {
  try {
    const student = await students.findById(req.params.id);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
    res.json({ success: true, data: safeStudent(student) });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/admin/students/:id
 */
const updateStudent = [
  body('name').optional().trim().notEmpty(),
  body('cgpa').optional().isFloat({ min: 0, max: 10 }),
  body('branch').optional().trim().notEmpty(),
  body('graduationYear').optional().isInt({ min: 2020 }),
  body('backlogs').optional().isInt({ min: 0 }),
  validate,
  async (req, res, next) => {
    try {
      const existing = await students.findById(req.params.id);
      if (!existing) return res.status(404).json({ success: false, message: 'Student not found' });

      const allowed = ['name', 'phone', 'cgpa', 'branch', 'graduationYear', 'backlogs', 'skills'];
      const updates = {};
      allowed.forEach((key) => {
        if (req.body[key] !== undefined) updates[key] = req.body[key];
      });

      const updated = await students.update(req.params.id, updates);
      res.json({ success: true, message: 'Student updated', data: safeStudent(updated) });
    } catch (err) {
      next(err);
    }
  },
];

/**
 * PATCH /api/admin/students/:id/status
 * Toggle isActive (disable/enable)
 */
const toggleStudentStatus = async (req, res, next) => {
  try {
    const student = await students.findById(req.params.id);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

    const newStatus = !student.isActive;
    const updated = await students.update(req.params.id, { isActive: newStatus });

    res.json({
      success: true,
      message: `Student ${updated.isActive ? 'enabled' : 'disabled'}`,
      data: safeStudent(updated),
    });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/admin/students/:id
 */
const deleteStudent = async (req, res, next) => {
  try {
    const student = await students.findById(req.params.id);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

    await students.delete(req.params.id);
    res.json({ success: true, message: 'Student deleted' });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAllStudents,
  getStudentById,
  updateStudent,
  toggleStudentStatus,
  deleteStudent,
};
