const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth.middleware');
const trainings = require('../controllers/admin.trainings.controller');
const drives = require('../controllers/admin.drives.controller');
const applications = require('../controllers/admin.applications.controller');
const interviews = require('../controllers/admin.interviews.controller');
const notifications = require('../controllers/admin.notifications.controller');

// ── Shared / Student-facing routes ────────────────────────────────────────────

// Trainings (public read, enroll requires auth)
router.get('/trainings', trainings.getPublicTrainings);
router.get('/trainings/student', authenticate, authorize('student'), trainings.getMyTrainings);
router.get('/trainings/:id', trainings.getPublicTrainingById);
router.post('/trainings/:id/enroll', authenticate, authorize('student'), trainings.enrollStudent);

// Placement Drives
router.get('/drives', drives.getAllDrives);
router.get('/drives/:id', drives.getDriveById);
router.get('/drives/:id/eligibility', authenticate, authorize('student'), drives.checkEligibility);
router.post('/drives/:id/apply', authenticate, authorize('student'), applications.applyForDrive);

// Student's own applications
router.get('/applications/student', authenticate, authorize('student'), applications.getMyApplications);

// Student's own interviews
router.get('/interviews/student', authenticate, authorize('student'), interviews.getMyInterviews);

// Student notifications
router.get('/notifications/me', authenticate, authorize('student'), notifications.getMyNotifications);
router.patch('/notifications/:id/read', authenticate, authorize('student'), notifications.markAsRead);

module.exports = router;
