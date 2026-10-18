const express = require('express');
const router = express.Router();
const { login, getMe } = require('../controllers/recruiter.auth.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

// POST /api/auth/recruiter/login
router.post('/login', login);

// GET /api/auth/recruiter/me  (protected)
router.get('/me', authenticate, authorize('recruiter'), getMe);

module.exports = router;
