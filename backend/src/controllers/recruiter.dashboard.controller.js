const prisma = require('../lib/prisma');
const { loadRecruiter } = require('../services/recruiter.context');

/** GET /api/recruiter/dashboard */
const getDashboard = async (req, res, next) => {
  try {
    const recruiter = await loadRecruiter(req);
    if (!recruiter) return res.status(404).json({ success: false, message: 'Recruiter account not found' });

    const drives = await prisma.placementDrive.findMany({
      where: { companyId: recruiter.companyId },
      select: { id: true, status: true },
    });
    const driveIds = drives.map((d) => d.id);

    const [totalApplications, byStatusRows, recentApplications] = await Promise.all([
      prisma.application.count({ where: { driveId: { in: driveIds } } }),
      prisma.application.groupBy({
        by: ['status'],
        where: { driveId: { in: driveIds } },
        _count: { _all: true },
      }),
      prisma.application.findMany({
        where: { driveId: { in: driveIds } },
        orderBy: { appliedAt: 'desc' },
        take: 5,
        include: {
          student: { select: { id: true, name: true, email: true, branch: true, cgpa: true } },
          drive: { select: { id: true, jobRole: true } },
        },
      }),
    ]);

    const byStatus = {};
    for (const row of byStatusRows) byStatus[row.status || 'Unknown'] = row._count._all;

    res.json({
      success: true,
      data: {
        drives: { total: drives.length, active: drives.filter((d) => d.status === 'active').length },
        applications: { total: totalApplications, byStatus },
        recentApplications,
      },
    });
  } catch (err) {
    next(err);
  }
};

/** GET /api/recruiter/company */
const getCompanyProfile = async (req, res, next) => {
  try {
    const recruiter = await loadRecruiter(req);
    if (!recruiter) return res.status(404).json({ success: false, message: 'Recruiter account not found' });
    const company = await prisma.company.findUnique({ where: { id: recruiter.companyId } });
    if (!company) return res.status(404).json({ success: false, message: 'Company not found' });
    res.json({ success: true, data: company });
  } catch (err) {
    next(err);
  }
};

/** GET /api/recruiter/analytics */
const getAnalytics = async (req, res, next) => {
  try {
    const recruiter = await loadRecruiter(req);
    if (!recruiter) return res.status(404).json({ success: false, message: 'Recruiter account not found' });

    const drives = await prisma.placementDrive.findMany({
      where: { companyId: recruiter.companyId },
      select: { id: true, jobRole: true, status: true },
    });
    const driveIds = drives.map((d) => d.id);

    const [byStatusRows, perDriveRows, studentsTotal] = await Promise.all([
      prisma.application.groupBy({
        by: ['status'], where: { driveId: { in: driveIds } }, _count: { _all: true },
      }),
      prisma.application.groupBy({
        by: ['driveId'], where: { driveId: { in: driveIds } }, _count: { _all: true },
      }),
      prisma.student.count(),
    ]);

    const applicantsByDrive = {};
    for (const row of perDriveRows) applicantsByDrive[row.driveId] = row._count._all;
    const applicationsByStatus = {};
    for (const row of byStatusRows) applicationsByStatus[row.status || 'Unknown'] = row._count._all;

    res.json({
      success: true,
      data: {
        drives: drives.map((d) => ({ ...d, applicants: applicantsByDrive[d.id] || 0 })),
        applicationsByStatus,
        totals: {
          drives: drives.length,
          activeDrives: drives.filter((d) => d.status === 'active').length,
          applications: Object.values(applicationsByStatus).reduce((a, b) => a + b, 0),
          eligibleStudents: studentsTotal,
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getDashboard, getCompanyProfile, getAnalytics };
