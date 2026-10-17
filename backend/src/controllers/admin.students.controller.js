const { body, param, query } = require('express-validator');
const { validate } = require('../middleware/validate.middleware');
const { students, generateId } = require('../config/db');
const bcrypt = require('bcryptjs');

// ── Helpers ───────────────────────────────────────────────────────────────────
const safeStudent = ({ password, resumeStoragePath, resumeMimeType, resumeSize, ...rest }) => rest;

// ── Controllers ───────────────────────────────────────────────────────────────

/**
 * GET /api/admin/students
 * Query: ?search=name&branch=CSE&graduationYear=2025&isActive=true
 */
const getAllStudents = (req, res) => {
  let result = [...students];
  const { search, branch, graduationYear, isActive } = req.query;

  if (search) {
    const q = search.toLowerCase();
    result = result.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q)
    );
  }
  if (branch) result = result.filter((s) => s.branch === branch);
  if (graduationYear) result = result.filter((s) => s.graduationYear === parseInt(graduationYear));
  if (isActive !== undefined) result = result.filter((s) => s.isActive === (isActive === 'true'));

  res.json({
    success: true,
    total: result.length,
    data: result.map(safeStudent),
  });
};

/**
 * GET /api/admin/students/:id
 */
const getStudentById = (req, res) => {
  const student = students.find((s) => s.id === req.params.id);
  if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
  res.json({ success: true, data: safeStudent(student) });
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
  (req, res) => {
    const idx = students.findIndex((s) => s.id === req.params.id);
    if (idx === -1) return res.status(404).json({ success: false, message: 'Student not found' });

    const allowed = ['name', 'phone', 'cgpa', 'branch', 'graduationYear', 'backlogs', 'skills'];
    allowed.forEach((key) => {
      if (req.body[key] !== undefined) students[idx][key] = req.body[key];
    });
    students[idx].updatedAt = new Date().toISOString();

    res.json({ success: true, message: 'Student updated', data: safeStudent(students[idx]) });
  },
];

/**
 * PATCH /api/admin/students/:id/status
 * Toggle isActive (disable/enable)
 */
const toggleStudentStatus = (req, res) => {
  const student = students.find((s) => s.id === req.params.id);
  if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

  student.isActive = !student.isActive;
  student.updatedAt = new Date().toISOString();

  res.json({
    success: true,
    message: `Student ${student.isActive ? 'enabled' : 'disabled'}`,
    data: safeStudent(student),
  });
};

/**
 * DELETE /api/admin/students/:id
 */
const deleteStudent = (req, res) => {
  const idx = students.findIndex((s) => s.id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false, message: 'Student not found' });

  students.splice(idx, 1);
  res.json({ success: true, message: 'Student deleted' });
};

module.exports = {
  getAllStudents,
  getStudentById,
  updateStudent,
  toggleStudentStatus,
  deleteStudent,
};
