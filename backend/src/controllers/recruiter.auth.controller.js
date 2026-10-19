const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body } = require('express-validator');
const { validate } = require('../middleware/validate.middleware');
const prisma = require('../lib/prisma');
const config = require('../config/config');

// ── Validation rules ──────────────────────────────────────────────────────────
const loginRules = [
  body('email').isEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password required'),
];

// ── Helpers ───────────────────────────────────────────────────────────────────
const signToken = (user) =>
  jwt.sign(
    { id: user.id, email: user.email, role: user.role || 'recruiter', name: user.name },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn },
  );

const safeRecruiter = ({ password, ...rest }) => rest;

// ── Controllers ───────────────────────────────────────────────────────────────

/**
 * POST /api/auth/recruiter/login
 * bcrypt + JWT against public.recruiters (same pattern as admin auth).
 */
const login = [
  ...loginRules,
  validate,
  async (req, res, next) => {
    try {
      const { email, password } = req.body;
      const recruiter = await prisma.recruiter.findUnique({
        where: { email: email.trim().toLowerCase() },
        include: { company: true },
      });

      if (!recruiter || recruiter.isActive === false) {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
      }

      const isMatch = await bcrypt.compare(password, recruiter.password);
      if (!isMatch) {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
      }

      const token = signToken(recruiter);
      res.json({
        success: true,
        message: 'Login successful',
        token,
        user: safeRecruiter(recruiter),
      });
    } catch (err) {
      next(err);
    }
  },
];

/**
 * GET /api/auth/recruiter/me  (protected)
 */
const getMe = async (req, res, next) => {
  try {
    const recruiter = await prisma.recruiter.findUnique({
      where: { id: req.user.id },
      include: { company: true },
    });
    if (!recruiter) {
      return res.status(404).json({ success: false, message: 'Recruiter account not found' });
    }
    res.json({ success: true, data: safeRecruiter(recruiter) });
  } catch (err) {
    next(err);
  }
};

module.exports = { login, getMe };
