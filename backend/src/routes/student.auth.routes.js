const express = require('express');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { getMe } = require('../controllers/student.auth.controller');

const router = express.Router();

router.get('/me', authenticate, authorize('student'), getMe);

module.exports = router;
