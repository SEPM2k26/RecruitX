const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body } = require('express-validator');
const config = require('../config/config');
const students = require('../repositories/student.repository');
const { validate } = require('../middleware/validate.middleware');
const { safeStudent } = require('../services/student-profile.service');

const signStudentToken = (student) =>
  jwt.sign(
    { id: student.id, sub: student.id, email: student.email, role: 'student', name: student.name },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );

const loginRules = [
  body('email').trim().isEmail().withMessage('Valid email required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password required'),
];

const registerRules = [
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
  body('email').trim().isEmail().withMessage('Valid email required').normalizeEmail(),
  body('registrationNumber').trim().notEmpty().withMessage('Registration number is required'),
  body('password').isLength({ min: 6, max: 128 }).withMessage('Password must be at least 6 characters'),
];

const login = [
  ...loginRules,
  validate,
  async (req, res, next) => {
    try {
      const { email, password } = req.body;
      const student = await students.findByEmail(email);

      if (!student) {
        return res.status(401).json({ success: false, message: 'Invalid email or password.' });
      }

      if (student.isActive === false) {
        return res.status(403).json({ success: false, message: 'This student account is inactive.' });
      }

      const isMatch = await bcrypt.compare(password, student.password);
      if (!isMatch) {
        return res.status(401).json({ success: false, message: 'Invalid email or password.' });
      }

      const token = signStudentToken(student);
      return res.json({
        success: true,
        message: 'Login successful',
        token,
        user: safeStudent(student),
      });
    } catch (err) {
      next(err);
    }
  },
];

const register = [
  ...registerRules,
  validate,
  async (req, res, next) => {
    try {
      const { name, email, registrationNumber, password } = req.body;

      const existingEmail = await students.findByEmail(email);
      if (existingEmail) {
        return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
      }

      const existingReg = await students.findByRegistrationNumber(registrationNumber);
      if (existingReg) {
        return res.status(409).json({ success: false, message: 'This registration number is already in use.' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const student = await students.create({
        name,
        email,
        registrationNumber,
        password: hashedPassword,
        role: 'student',
      });

      const token = signStudentToken(student);
      return res.status(201).json({
        success: true,
        message: 'Student account created.',
        token,
        user: safeStudent(student),
      });
    } catch (err) {
      next(err);
    }
  },
];

const getMe = async (req, res, next) => {
  try {
    let student = await students.findByAuthUserId(req.user.id);
    if (!student) {
      student = await students.findById(req.user.id);
    }
    if (!student && req.user.email) {
      student = await students.findByEmail(req.user.email);
    }
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student profile not found. Please contact the placement office.',
      });
    }
    if (student.isActive === false) {
      return res.status(403).json({ success: false, message: 'This student account is inactive.' });
    }
    return res.json({ success: true, user: safeStudent(student) });
  } catch (error) {
    return next(error);
  }
};

const forgotPassword = (req, res) =>
  res.status(501).json({
    success: false,
    message: 'Password recovery is not configured. Contact your placement office for help.',
  });

module.exports = { login, register, getMe, forgotPassword };
