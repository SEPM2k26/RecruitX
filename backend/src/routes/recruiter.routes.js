const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth.middleware');
const dashboard = require('../controllers/recruiter.dashboard.controller');
const drives = require('../controllers/recruiter.drives.controller');
const applications = require('../controllers/recruiter.applications.controller');

// All recruiter routes require authentication + recruiter role.
router.use(authenticate, authorize('recruiter'));

// ── Dashboard & company ──────────────────────────────────────────────────────
router.get('/dashboard', dashboard.getDashboard);
router.get('/company', dashboard.getCompanyProfile);

// ── Placement drives (company-scoped) ────────────────────────────────────────
router.get('/drives', drives.listDrives);
router.post('/drives', drives.createDrive);
router.get('/drives/:id', drives.getDriveById);
router.put('/drives/:id', drives.updateDrive);
router.patch('/drives/:id/status', drives.updateDriveStatus);
router.delete('/drives/:id', drives.deleteDrive);

// ── Applicants & application status ──────────────────────────────────────────
router.get('/drives/:id/applicants', applications.listApplicants);
router.patch('/applications/:id/status', applications.updateApplicationStatus);

// ── Analytics ────────────────────────────────────────────────────────────────
router.get('/analytics', dashboard.getAnalytics);

module.exports = router;
