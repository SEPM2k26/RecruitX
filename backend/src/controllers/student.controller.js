const fs = require('fs');
const path = require('path');
const { body } = require('express-validator');
const students = require('../repositories/student.repository');
const { validate } = require('../middleware/validate.middleware');
const { safeStudent, getStudentResumeMetadata } = require('../services/student-profile.service');
const { resumeDirectory, uploadResume: resumeUpload, removeStoredResume } = require('../storage/resumeStorage');

const profileRules = [
  body('name').optional().trim().isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
  body('phone').optional({ checkFalsy: true }).matches(/^[+\d() .-]{7,24}$/).withMessage('Enter a valid phone number'),
  body('branch').optional({ checkFalsy: true }).trim().isLength({ max: 40 }).withMessage('Branch must be 40 characters or fewer'),
  body('graduationYear').optional({ checkFalsy: true }).isInt({ min: 2000, max: 2100 }).withMessage('Enter a valid graduation year'),
  body('cgpa').optional({ checkFalsy: true }).isFloat({ min: 0, max: 10 }).withMessage('CGPA must be between 0 and 10'),
  body('backlogs').optional({ checkFalsy: true }).isInt({ min: 0 }).withMessage('Backlogs must be zero or greater'),
  body('linkedinUrl').optional({ checkFalsy: true }).isURL({ require_protocol: true }).withMessage('Enter a valid LinkedIn URL'),
  body('portfolioUrl').optional({ checkFalsy: true }).isURL({ require_protocol: true }).withMessage('Enter a valid portfolio URL'),
  body('skills').optional().isArray({ max: 30 }).withMessage('Skills must be a list with at most 30 items'),
  body('skills.*').optional().isString().trim().isLength({ min: 1, max: 40 }).withMessage('Each skill must be between 1 and 40 characters'),
];

const getProfile = (req, res) => {
  const student = students.findById(req.user.id);
  if (!student) return res.status(404).json({ success: false, message: 'Student profile not found.' });
  return res.json({ success: true, data: safeStudent(student) });
};

const updateProfile = [
  ...profileRules,
  validate,
  (req, res) => {
    const student = students.findById(req.user.id);
    if (!student) return res.status(404).json({ success: false, message: 'Student profile not found.' });

    const allowed = ['name', 'phone', 'branch', 'graduationYear', 'cgpa', 'backlogs', 'linkedinUrl', 'portfolioUrl', 'skills'];
    const changes = {};
    for (const key of allowed) {
      if (req.body[key] === undefined) continue;
      if (key === 'graduationYear' || key === 'cgpa' || key === 'backlogs') {
        changes[key] = req.body[key] === null || req.body[key] === '' ? null : Number(req.body[key]);
      } else if (key === 'skills') {
        changes.skills = normalizeSkills(req.body.skills);
      } else {
        changes[key] = typeof req.body[key] === 'string' ? req.body[key].trim() : req.body[key];
      }
    }
    const updated = students.update(req.user.id, changes);
    return res.json({ success: true, message: 'Profile updated.', data: safeStudent(updated) });
  },
];

const getSkills = (req, res) => {
  const student = students.findById(req.user.id);
  if (!student) return res.status(404).json({ success: false, message: 'Student profile not found.' });
  return res.json({ success: true, data: { skills: student.skills || [] } });
};

const updateSkills = [
  body('skills').isArray({ max: 30 }).withMessage('Skills must be a list with at most 30 items'),
  body('skills.*').isString().trim().isLength({ min: 1, max: 40 }).withMessage('Each skill must be between 1 and 40 characters'),
  validate,
  (req, res) => {
    const student = students.findById(req.user.id);
    if (!student) return res.status(404).json({ success: false, message: 'Student profile not found.' });
    const updated = students.update(req.user.id, { skills: normalizeSkills(req.body.skills) });
    return res.json({ success: true, data: { skills: updated.skills } });
  },
];

const uploadResume = [
  (req, res, next) => uploadResumeMiddleware(req, res, next),
  async (req, res, next) => {
    try {
      if (!req.file) return res.status(400).json({ success: false, message: 'Choose a resume file to upload.' });
      const student = students.findById(req.user.id);
      if (!student) {
        await removeStoredResume(req.file.path);
        return res.status(404).json({ success: false, message: 'Student profile not found.' });
      }

      const previousPath = student.resumeStoragePath;
      students.update(req.user.id, {
        resumeFileName: path.basename(req.file.originalname),
        resumeStoragePath: req.file.path,
        resumeMimeType: req.file.mimetype,
        resumeSize: req.file.size,
        resumeUploadedAt: new Date().toISOString(),
        resumeUrl: '/api/students/me/resume/file',
      });
      if (previousPath) await removeStoredResume(previousPath).catch((error) => console.error('Failed to remove replaced resume:', error.message));

      return res.status(201).json({ success: true, message: 'Resume uploaded.', data: { resume: getStudentResumeMetadata(student) } });
    } catch (error) {
      if (req.file?.path) await removeStoredResume(req.file.path).catch(() => {});
      next(error);
    }
  },
];

const downloadResume = (req, res, next) => {
  const student = students.findById(req.user.id);
  if (!student?.resumeStoragePath || !student.resumeFileName) {
    return res.status(404).json({ success: false, message: 'No resume has been uploaded.' });
  }

  const resolvedPath = path.resolve(student.resumeStoragePath);
  if (!resolvedPath.startsWith(`${resumeDirectory}${path.sep}`)) {
    return res.status(404).json({ success: false, message: 'Resume file not found.' });
  }

  return fs.access(resolvedPath, fs.constants.R_OK, (error) => {
    if (error) return res.status(404).json({ success: false, message: 'Resume file not found.' });
    return res.download(resolvedPath, student.resumeFileName, (downloadError) => {
      if (downloadError && !res.headersSent) next(downloadError);
    });
  });
};

const deleteResume = async (req, res, next) => {
  try {
    const student = students.findById(req.user.id);
    if (!student) return res.status(404).json({ success: false, message: 'Student profile not found.' });
    if (!student.resumeStoragePath) return res.status(404).json({ success: false, message: 'No resume has been uploaded.' });
    await removeStoredResume(student.resumeStoragePath);
    students.update(req.user.id, {
      resumeUrl: null,
      resumeFileName: null,
      resumeStoragePath: null,
      resumeMimeType: null,
      resumeSize: null,
      resumeUploadedAt: null,
    });
    return res.json({ success: true, message: 'Resume deleted.' });
  } catch (error) {
    next(error);
  }
};

function normalizeSkills(skills) {
  const unique = new Map();
  for (const skill of skills || []) {
    const value = String(skill).trim();
    if (value) unique.set(value.toLowerCase(), value);
  }
  return [...unique.values()];
}

function uploadResumeMiddleware(req, res, next) {
  resumeUpload.single('resume')(req, res, (error) => {
    if (error) return next(error);
    next();
  });
}

module.exports = { getProfile, updateProfile, getSkills, updateSkills, uploadResume, downloadResume, deleteResume };
