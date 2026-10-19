const { body } = require('express-validator');
const { validate } = require('../middleware/validate.middleware');
const prisma = require('../lib/prisma');
const { APP_STATUS, loadRecruiter, findOwnDrive } = require('../services/recruiter.context');
const { getBucket } = require('../storage/supabaseStorage');

/** GET /api/recruiter/drives/:id/applicants */
const listApplicants = async (req, res, next) => {
  try {
    const recruiter = await loadRecruiter(req);
    if (!recruiter) return res.status(404).json({ success: false, message: 'Recruiter account not found' });
    const drive = await findOwnDrive(recruiter, req.params.id);
    if (!drive) return res.status(404).json({ success: false, message: 'Drive not found' });

    const applications = await prisma.application.findMany({
      where: { driveId: drive.id },
      orderBy: { appliedAt: 'desc' },
      include: {
        student: {
          select: {
            id: true, name: true, email: true, registrationNumber: true,
            cgpa: true, branch: true, graduationYear: true, backlogs: true,
            phone: true, skills: true, resumeUrl: true, resumeFileName: true,
            resumeStoragePath: true,
          },
        },
      },
    });

    const enriched = applications.map((app) => {
      const student = app.student;
      const hasResume = Boolean(student?.resumeStoragePath || student?.resumeUrl || student?.resumeFileName);
      return {
        ...app,
        student: student
          ? {
              ...student,
              hasResume,
              resumeDownloadUrl: hasResume ? `/api/recruiter/students/${student.id}/resume` : null,
            }
          : null,
      };
    });

    res.json({ success: true, total: enriched.length, data: enriched });
  } catch (err) {
    next(err);
  }
};

/** GET /api/recruiter/students/:studentId/resume */
const getStudentResume = async (req, res, next) => {
  try {
    const recruiter = await loadRecruiter(req);
    if (!recruiter) return res.status(404).json({ success: false, message: 'Recruiter account not found' });

    const student = await prisma.student.findUnique({
      where: { id: req.params.studentId },
      select: {
        id: true,
        name: true,
        resumeFileName: true,
        resumeStoragePath: true,
        resumeMimeType: true,
        resumeUrl: true,
      },
    });

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    if (student.resumeStoragePath) {
      const bucket = getBucket();
      const { data, error } = await bucket.download(student.resumeStoragePath);
      if (error) {
        return res.status(404).json({ success: false, message: 'Resume file not found in storage' });
      }
      res.type(student.resumeMimeType || 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="${student.resumeFileName || 'resume.pdf'}"`);
      return res.send(Buffer.from(await data.arrayBuffer()));
    }

    if (student.resumeUrl && student.resumeUrl.startsWith('http')) {
      return res.redirect(student.resumeUrl);
    }

    return res.status(404).json({ success: false, message: 'Student has not uploaded a resume yet' });
  } catch (err) {
    next(err);
  }
};

/** PATCH /api/recruiter/applications/:id/status */
const updateApplicationStatus = [
  body('status').isIn(APP_STATUS).withMessage('Invalid application status'),
  validate,
  async (req, res, next) => {
    try {
      const recruiter = await loadRecruiter(req);
      if (!recruiter) return res.status(404).json({ success: false, message: 'Recruiter account not found' });

      const application = await prisma.application.findUnique({
        where: { id: req.params.id },
        include: { drive: { select: { companyId: true } } },
      });
      if (!application || (application.drive && application.drive.companyId !== recruiter.companyId)) {
        return res.status(404).json({ success: false, message: 'Application not found' });
      }

      const updated = await prisma.application.update({
        where: { id: application.id },
        data: { status: req.body.status },
        include: {
          student: { select: { id: true, name: true, email: true, branch: true, cgpa: true } },
        },
      });
      res.json({ success: true, message: 'Application status updated', data: updated });
    } catch (err) {
      next(err);
    }
  },
];

module.exports = { listApplicants, getStudentResume, updateApplicationStatus };
