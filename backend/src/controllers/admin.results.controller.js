const { body } = require('express-validator');
const { validate } = require('../middleware/validate.middleware');
const { applications, interviews, students, placementDrives, notifications } = require('../config/db');

// Final result statuses
const FINAL_STATUSES = ['Selected', 'Rejected', 'Waitlisted'];

// ── Controllers ───────────────────────────────────────────────────────────────

/**
 * GET /api/admin/results
 * Returns all application results with enriched data
 * Query: ?status=Selected&driveId=...&branch=...
 */
const getAllResults = async (req, res, next) => {
  try {
    const { status, driveId, branch } = req.query;
    const allApps = await applications.findAll({ status, driveId });
    const allInterviews = await interviews.findAll();

    let results = allApps.map((app) => {
      const studentInterviews = allInterviews.filter(
        (i) => i.studentId === app.studentId && i.driveId === app.driveId
      );
      return {
        applicationId: app.id,
        status: app.status,
        appliedAt: app.appliedAt,
        updatedAt: app.updatedAt,
        student: app.student,
        drive: app.drive,
        interviews: studentInterviews,
      };
    });

    if (branch) {
      results = results.filter((r) => r.student && r.student.branch === branch);
    }

    res.json({ success: true, total: results.length, data: results });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/admin/results/:applicationId
 * Sets final result: Selected | Rejected | Waitlisted
 */
const setFinalResult = [
  body('status').isIn(FINAL_STATUSES).withMessage(`Status must be: ${FINAL_STATUSES.join(', ')}`),
  validate,
  async (req, res, next) => {
    try {
      const app = await applications.findById(req.params.applicationId);
      if (!app) return res.status(404).json({ success: false, message: 'Application not found' });

      const prevStatus = app.status;
      const updated = await applications.updateStatus(req.params.applicationId, req.body.status);

      const messages = {
        Selected: '🎉 Congratulations! You have been SELECTED!',
        Rejected: 'We regret to inform you that your application has been rejected.',
        Waitlisted: 'You have been placed on the waitlist.',
      };

      await notifications.create({
        userId: app.studentId,
        type: 'application_status',
        message: messages[req.body.status] || `Result updated to: ${req.body.status}`,
      });

      const allInterviews = await interviews.findAll({
        studentId: app.studentId,
        driveId: app.driveId,
      });

      const enriched = {
        applicationId: updated.id,
        status: updated.status,
        appliedAt: updated.appliedAt,
        updatedAt: updated.updatedAt,
        student: updated.student,
        drive: updated.drive,
        interviews: allInterviews,
      };

      res.json({
        success: true,
        message: `Result updated: ${prevStatus} → ${req.body.status}`,
        data: enriched,
      });
    } catch (err) {
      next(err);
    }
  },
];

/**
 * GET /api/admin/results/summary
 * Dashboard-friendly aggregates
 */
const getResultSummary = async (req, res, next) => {
  try {
    const allApps = await applications.findAll();
    const total = allApps.length;
    const byStatus = {};
    allApps.forEach((a) => {
      byStatus[a.status] = (byStatus[a.status] || 0) + 1;
    });

    // Branch-wise selected
    const branchWise = {};
    allApps
      .filter((a) => a.status === 'Selected')
      .forEach((a) => {
        if (a.student && a.student.branch) {
          branchWise[a.student.branch] = (branchWise[a.student.branch] || 0) + 1;
        }
      });

    res.json({
      success: true,
      data: {
        totalApplications: total,
        byStatus,
        selectedByBranch: branchWise,
        selectionRate: total > 0 ? ((byStatus['Selected'] || 0) / total * 100).toFixed(1) + '%' : '0%',
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAllResults, setFinalResult, getResultSummary };
