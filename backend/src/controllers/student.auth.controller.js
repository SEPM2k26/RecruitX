const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body } = require('express-validator');
const config = require('../config/config');
const { generateId } = require('../config/db');
const students = require('../repositories/student.repository');
const { validate } = require('../middleware/validate.middleware');
const { safeStudent } = require('../services/student-profile.service');

const registerRules = [
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
  body('email').trim().isEmail().withMessage('Valid email required').normalizeEmail(),
  body('registrationNumber').trim().isLength({ min: 2, max: 40 }).withMessage('Registration number is required'),
  body('password').isLength({ min: 8, max: 128 }).withMessage('Password must be between 8 and 128 characters'),
];

const loginRules = [
  body('email').trim().isEmail().withMessage('Valid email required').normalizeEmail(),
  body('password').isLength({ min: 1, max: 128 }).withMessage('Password required'),
];

const signStudentToken = (student) => jwt.sign(
  { id: student.id, sub: student.id, email: student.email, role: 'student', name: student.name },
  config.jwt.secret,
  { expiresIn: config.jwt.expiresIn },
);

const register = [
  ...registerRules,
  validate,
  async (req, res, next) => {
    try {
      const email = students.normalizeEmail(req.body.email);
      const registrationNumber = students.normalizeRegistrationNumber(req.body.registrationNumber);
      if (students.findByEmail(email)) {
        return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
      }
      if (students.findByRegistrationNumber(registrationNumber)) {
        return res.status(409).json({ success: false, message: 'This registration number is already in use.' });
      }

      const student = students.create({
        id: generateId('stu'),
        name: req.body.name.trim(),
        email,
        registrationNumber,
        password: await bcrypt.hash(req.body.password, 12),
        role: 'student',
        phone: '',
        branch: '',
        graduationYear: null,
        cgpa: null,
        backlogs: null,
        skills: [],
        linkedinUrl: '',
        portfolioUrl: '',
        resumeUrl: null,
        resumeFileName: null,
        resumeStoragePath: null,
        resumeMimeType: null,
        resumeSize: null,
        resumeUploadedAt: null,
        isActive: true,
        createdAt: new Date().toISOString(),
      });

      const token = signStudentToken(student);
      return res.status(201).json({
        success: true,
        message: 'Student account created.',
        token,
        user: safeStudent(student),
      });
    } catch (error) {
      next(error);
    }
  },
];

const login = [
  ...loginRules,
  validate,
  async (req, res, next) => {
    try {
      const student = students.findByEmail(req.body.email);
      if (!student || !(await bcrypt.compare(req.body.password, student.password))) {
        return res.status(401).json({ success: false, message: 'Invalid email or password.' });
      }
      if (student.isActive === false) {
        return res.status(403).json({ success: false, message: 'This student account is disabled. Contact the placement office.' });
      }

      return res.json({
        success: true,
        message: 'Login successful.',
        token: signStudentToken(student),
        user: safeStudent(student),
      });
    } catch (error) {
      next(error);
    }
  },
];

const getMe = (req, res) => {
  const student = students.findById(req.user.id);
  if (!student) return res.status(404).json({ success: false, message: 'Student account not found.' });
  return res.json({ success: true, user: safeStudent(student) });
};

const forgotPassword = (req, res) => res.status(501).json({
  success: false,
  message: 'Password recovery is not configured yet. Contact your placement office for help.',
});

module.exports = { register, login, getMe, forgotPassword };
