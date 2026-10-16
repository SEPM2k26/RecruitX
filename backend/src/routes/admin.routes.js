const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth.middleware');
const students = require('../controllers/admin.students.controller');
const companies = require('../controllers/admin.companies.controller');
const trainings = require('../controllers/admin.trainings.controller');
const drives = require('../controllers/admin.drives.controller');
const applications = require('../controllers/admin.applications.controller');
const interviews = require('../controllers/admin.interviews.controller');
const results = require('../controllers/admin.results.controller');
const notifications = require('../controllers/admin.notifications.controller');

// All admin routes require authentication + admin role
router.use(authenticate, authorize('admin'));

// ── Students ─────────────────────────────────────────────────────────────────
router.get('/students', students.getAllStudents);
router.get('/students/:id', students.getStudentById);
router.put('/students/:id', students.updateStudent);
router.patch('/students/:id/status', students.toggleStudentStatus);
router.delete('/students/:id', students.deleteStudent);

// ── Companies ────────────────────────────────────────────────────────────────
router.get('/companies', companies.getAllCompanies);
router.get('/companies/:id', companies.getCompanyById);
router.post('/companies', companies.createCompany);
router.put('/companies/:id', companies.updateCompany);
router.delete('/companies/:id', companies.deleteCompany);

// ── Trainings ────────────────────────────────────────────────────────────────
router.get('/trainings', trainings.getAllTrainings);
router.get('/trainings/:id', trainings.getTrainingById);
router.post('/trainings', trainings.createTraining);
router.put('/trainings/:id', trainings.updateTraining);
router.delete('/trainings/:id', trainings.deleteTraining);
router.get('/trainings/:id/enrollments', trainings.getEnrollments);

// ── Placement Drives ──────────────────────────────────────────────────────────
router.get('/drives', drives.getAllDrives);
router.get('/drives/:id', drives.getDriveById);
router.post('/drives', drives.createDrive);
router.put('/drives/:id', drives.updateDrive);
router.delete('/drives/:id', drives.deleteDrive);

// ── Applications ──────────────────────────────────────────────────────────────
router.get('/applications', applications.getAllApplications);
router.patch('/applications/:id/status', applications.updateApplicationStatus);
router.patch('/applications/:id/shortlist', applications.shortlistApplication);
router.patch('/applications/:id/reject', applications.rejectApplication);

// ── Interviews ────────────────────────────────────────────────────────────────
router.get('/interviews', interviews.getAllInterviews);
router.get('/interviews/:id', interviews.getInterviewById);
router.post('/interviews', interviews.createInterview);
router.put('/interviews/:id', interviews.updateInterview);
router.delete('/interviews/:id', interviews.deleteInterview);
router.patch('/interviews/:id/result', interviews.updateResult);

// ── Results ───────────────────────────────────────────────────────────────────
router.get('/results', results.getAllResults);
router.get('/results/summary', results.getResultSummary);
router.patch('/results/:applicationId', results.setFinalResult);

// ── Notifications ─────────────────────────────────────────────────────────────
router.get('/notifications', notifications.getAllNotifications);
router.post('/notifications', notifications.createNotification);
router.post('/notifications/broadcast', notifications.broadcastNotification);

module.exports = router;
