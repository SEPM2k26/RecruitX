const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth.middleware');
const studentData = require('../controllers/student.data.controller');

// ── Shared / Student-facing routes ────────────────────────────────────────────

// Trainings (public read, enroll requires auth)
router.get('/trainings', studentData.getPublicTrainings);
router.get('/trainings/student', authenticate, authorize('student'), studentData.getMyTrainings);
router.get('/trainings/:id', studentData.getPublicTrainingById);
router.post('/trainings/:id/enroll', authenticate, authorize('student'), studentData.enrollInTraining);

// Placement Drives
router.get('/drives', studentData.getDrives);
router.get('/drives/:id', studentData.getDriveById);
router.get('/drives/:id/eligibility', authenticate, authorize('student'), studentData.checkEligibility);
router.post('/drives/:id/apply', authenticate, authorize('student'), studentData.applyForDrive);

// Student's own applications
router.get('/applications/student', authenticate, authorize('student'), studentData.getMyApplications);

// Student's own interviews
router.get('/interviews/student', authenticate, authorize('student'), studentData.getMyInterviews);

// Student notifications
router.get('/notifications/me', authenticate, authorize('student'), studentData.getMyNotifications);
router.patch('/notifications/:id/read', authenticate, authorize('student'), studentData.markNotificationRead);

module.exports = router;
