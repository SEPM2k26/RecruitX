const prisma = require('../lib/prisma');

// Shared context for recruiter endpoints. The recruiter's company_id is the
// authorization boundary: every query is scoped to it.
const APP_STATUS = ['Applied', 'Shortlisted', 'Aptitude', 'Technical Interview', 'HR Interview', 'Selected', 'Rejected', 'Waitlisted'];
const DRIVE_STATUS = ['active', 'closed', 'draft', 'cancelled'];

/** Current recruiter row (contains companyId — the scoping key). */
const loadRecruiter = (req) =>
  prisma.recruiter.findUnique({ where: { id: req.user.id } });

/** Serialize drive with numeric minCGPA (Prisma Decimal → Number for JSON). */
const serializeDrive = (drive) =>
  drive ? { ...drive, minCGPA: drive.minCGPA === null ? null : Number(drive.minCGPA) } : drive;

/**
 * Ownership check: a drive is visible/editable only to recruiters whose
 * companyId matches the drive's companyId. 404 (not 403) hides existence.
 */
const findOwnDrive = async (recruiter, driveId) => {
  const drive = await prisma.placementDrive.findUnique({ where: { id: driveId } });
  if (!drive || drive.companyId !== recruiter.companyId) return null;
  return drive;
};

module.exports = { APP_STATUS, DRIVE_STATUS, loadRecruiter, serializeDrive, findOwnDrive };
