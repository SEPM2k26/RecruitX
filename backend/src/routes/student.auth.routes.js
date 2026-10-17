const express = require('express');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { login, register, getMe, forgotPassword } = require('../controllers/student.auth.controller');

const router = express.Router();

router.post('/login', login);
router.post('/register', register);
router.post('/forgot-password', forgotPassword);
router.get('/me', authenticate, authorize('student'), getMe);

module.exports = router;
