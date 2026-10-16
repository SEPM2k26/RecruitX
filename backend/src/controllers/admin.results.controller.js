const { body } = require('express-validator');
const { validate } = require('../middleware/validate.middleware');
const { applications, interviews, students, placementDrives, notifications, generateId } = require('../config/db');

// Final result statuses
const FINAL_STATUSES = ['Selected', 'Rejected', 'Waitlisted'];

// ── Helpers ───────────────────────────────────────────────────────────────────
const buildResult = (app) => {
  const student = students.find((s) => s.id === app.studentId);
  const drive = placementDrives.find((d) => d.id === app.driveId);
  const studentInterviews = interviews.filter(
    (i) => i.studentId === app.studentId && i.driveId === app.driveId
  );

  return {
    applicationId: app.id,
    status: app.status,
    appliedAt: app.appliedAt,
    updatedAt: app.updatedAt,
    student: student
      ? { id: student.id, name: student.name, email: student.email, branch: student.branch, cgpa: student.cgpa }
      : null,
    drive: drive
      ? { id: drive.id, jobRole: drive.jobRole, package: drive.package, companyId: drive.companyId }
      : null,
    interviews: studentInterviews,
  };
};

// ── Controllers ───────────────────────────────────────────────────────────────

/**
 * GET /api/admin/results
 * Returns all application results with enriched data
 * Query: ?status=Selected&driveId=...&branch=...
 */
const getAllResults = (req, res) => {
  let result = [...applications];
  const { status, driveId, branch } = req.query;

  if (status) result = result.filter((a) => a.status === status);
  if (driveId) result = result.filter((a) => a.driveId === driveId);
  if (branch) {
    result = result.filter((a) => {
      const student = students.find((s) => s.id === a.studentId);
      return student && student.branch === branch;
    });
  }

  res.json({ success: true, total: result.length, data: result.map(buildResult) });
};

/**
 * PATCH /api/admin/results/:applicationId
 * Sets final result: Selected | Rejected | Waitlisted
 */
const setFinalResult = [
  body('status').isIn(FINAL_STATUSES).withMessage(`Status must be: ${FINAL_STATUSES.join(', ')}`),
  validate,
  (req, res) => {
    const app = applications.find((a) => a.id === req.params.applicationId);
    if (!app) return res.status(404).json({ success: false, message: 'Application not found' });

    const prevStatus = app.status;
    app.status = req.body.status;
    app.updatedAt = new Date().toISOString();

    const messages = {
      Selected: '🎉 Congratulations! You have been SELECTED!',
      Rejected: 'We regret to inform you that your application has been rejected.',
      Waitlisted: 'You have been placed on the waitlist.',
    };

    notifications.push({
      id: generateId('notif'),
      userId: app.studentId,
      type: 'application_status',
      message: messages[req.body.status],
      read: false,
      createdAt: new Date().toISOString(),
    });

    res.json({
      success: true,
      message: `Result updated: ${prevStatus} → ${req.body.status}`,
      data: buildResult(app),
    });
  },
];

/**
 * GET /api/admin/results/summary
 * Dashboard-friendly aggregates
 */
const getResultSummary = (req, res) => {
  const total = applications.length;
  const byStatus = {};
  applications.forEach((a) => {
    byStatus[a.status] = (byStatus[a.status] || 0) + 1;
  });

  // Branch-wise selected
  const branchWise = {};
  applications
    .filter((a) => a.status === 'Selected')
    .forEach((a) => {
      const student = students.find((s) => s.id === a.studentId);
      if (student) {
        branchWise[student.branch] = (branchWise[student.branch] || 0) + 1;
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
};

module.exports = { getAllResults, setFinalResult, getResultSummary };
