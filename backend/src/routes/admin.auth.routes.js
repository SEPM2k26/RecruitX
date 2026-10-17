const express = require('express');
const router = express.Router();
const { login, registerAdmin, getMe } = require('../controllers/admin.auth.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const config = require('../config/config');

// POST /api/auth/admin/login
router.post('/login', login);

// POST /api/auth/admin/register
router.post(
  '/register',
  ...(config.nodeEnv === 'production' ? [authenticate, authorize('admin')] : []),
  registerAdmin,
);

// GET /api/auth/admin/me  (protected)
router.get('/me', authenticate, authorize('admin'), getMe);

module.exports = router;
