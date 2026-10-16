const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body } = require('express-validator');
const { validate } = require('../middleware/validate.middleware');
const { admins } = require('../config/db');
const config = require('../config/config');
const { generateId } = require('../config/db');

// ── Validation rules ──────────────────────────────────────────────────────────
const loginRules = [
  body('email').isEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password required'),
];

const registerAdminRules = [
  body('name').trim().notEmpty().withMessage('Name required'),
  body('email').isEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 6 }).withMessage('Password min 6 chars'),
];

// ── Helpers ───────────────────────────────────────────────────────────────────
const signToken = (user) =>
  jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );

const safeAdmin = ({ password, ...rest }) => rest;

// ── Controllers ───────────────────────────────────────────────────────────────

/**
 * POST /api/auth/admin/login
 */
const login = [
  ...loginRules,
  validate,
  async (req, res, next) => {
    try {
      const { email, password } = req.body;
      const admin = admins.find((a) => a.email === email);

      if (!admin) {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
      }

      const isMatch = await bcrypt.compare(password, admin.password);
      if (!isMatch) {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
      }

      const token = signToken(admin);
      res.json({
        success: true,
        message: 'Login successful',
        token,
        user: safeAdmin(admin),
      });
    } catch (err) {
      next(err);
    }
  },
];

/**
 * POST /api/auth/admin/register
 * Creates a new admin (super-admin only in production; open for dev)
 */
const registerAdmin = [
  ...registerAdminRules,
  validate,
  async (req, res, next) => {
    try {
      const { name, email, password } = req.body;
      if (admins.find((a) => a.email === email)) {
        return res.status(409).json({ success: false, message: 'Email already in use' });
      }

      const hashed = await bcrypt.hash(password, 10);
      const newAdmin = {
        id: generateId('admin'),
        name,
        email,
        password: hashed,
        role: 'admin',
        createdAt: new Date().toISOString(),
      };
      admins.push(newAdmin);

      const token = signToken(newAdmin);
      res.status(201).json({
        success: true,
        message: 'Admin registered successfully',
        token,
        user: safeAdmin(newAdmin),
      });
    } catch (err) {
      next(err);
    }
  },
];

/**
 * GET /api/auth/admin/me  (protected)
 */
const getMe = (req, res) => {
  const admin = admins.find((a) => a.id === req.user.id);
  if (!admin) return res.status(404).json({ success: false, message: 'Admin not found' });
  res.json({ success: true, user: safeAdmin(admin) });
};

module.exports = { login, registerAdmin, getMe };
