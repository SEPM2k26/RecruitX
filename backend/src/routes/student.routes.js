const express = require('express');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const students = require('../controllers/student.controller');

const router = express.Router();

router.use(authenticate, authorize('student'));
router.get('/me/profile', students.getProfile);
router.put('/me/profile', students.updateProfile);
router.get('/me/skills', students.getSkills);
router.put('/me/skills', students.updateSkills);
router.get('/me/resume/file', students.downloadResume);
router.post('/me/resume', students.uploadResume);
router.delete('/me/resume', students.deleteResume);

module.exports = router;
