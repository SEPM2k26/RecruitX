const path = require('path');
const { randomUUID } = require('crypto');
const { body } = require('express-validator');
const students = require('../repositories/student.repository');
const { validate } = require('../middleware/validate.middleware');
const { safeStudent, getStudentResumeMetadata } = require('../services/student-profile.service');
const { uploadResume: resumeUpload } = require('../storage/resumeStorage');
const { getBucket } = require('../storage/supabaseStorage');

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

const getProfile = async (req, res, next) => {
  try {
    const student = await students.findByAuthUserId(req.user.id);
    if (!student) return res.status(404).json({ success: false, message: 'Student profile not found.' });
    return res.json({ success: true, data: safeStudent(student) });
  } catch (error) { next(error); }
};

const updateProfile = [
  ...profileRules,
  validate,
  async (req, res, next) => {
    try {
      const allowed = ['name', 'phone', 'branch', 'graduationYear', 'cgpa', 'backlogs', 'linkedinUrl', 'portfolioUrl', 'skills'];
      const changes = {};
      for (const key of allowed) {
        if (req.body[key] === undefined) continue;
        if (['graduationYear', 'cgpa', 'backlogs'].includes(key)) {
          changes[key] = req.body[key] === null || req.body[key] === '' ? null : Number(req.body[key]);
        } else if (key === 'skills') changes.skills = normalizeSkills(req.body.skills);
        else changes[key] = typeof req.body[key] === 'string' ? req.body[key].trim() : req.body[key];
      }
      const updated = await students.updateByAuthUserId(req.user.id, changes);
      if (!updated) return res.status(404).json({ success: false, message: 'Student profile not found.' });
      return res.json({ success: true, message: 'Profile updated.', data: safeStudent(updated) });
    } catch (error) { next(error); }
  },
];

const getSkills = async (req, res, next) => {
  try {
    const student = await students.findByAuthUserId(req.user.id);
    if (!student) return res.status(404).json({ success: false, message: 'Student profile not found.' });
    return res.json({ success: true, data: { skills: student.skills || [] } });
  } catch (error) { next(error); }
};

const updateSkills = [
  body('skills').isArray({ max: 30 }).withMessage('Skills must be a list with at most 30 items'),
  body('skills.*').isString().trim().isLength({ min: 1, max: 40 }).withMessage('Each skill must be between 1 and 40 characters'),
  validate,
  async (req, res, next) => {
    try {
      const updated = await students.updateByAuthUserId(req.user.id, { skills: normalizeSkills(req.body.skills) });
      if (!updated) return res.status(404).json({ success: false, message: 'Student profile not found.' });
      return res.json({ success: true, data: { skills: updated.skills } });
    } catch (error) { next(error); }
  },
];

const uploadResume = [
  (req, res, next) => resumeUpload.single('resume')(req, res, next),
  async (req, res, next) => {
    let uploadedPath;
    try {
      if (!req.file) return res.status(400).json({ success: false, message: 'Choose a resume file to upload.' });
      const student = await students.findByAuthUserId(req.user.id);
      if (!student) return res.status(404).json({ success: false, message: 'Student profile not found.' });

      const bucket = getBucket();
      const extension = path.extname(req.file.originalname).toLowerCase();
      uploadedPath = `${student.id}/${randomUUID()}${extension}`;
      const { error: uploadError } = await bucket.upload(uploadedPath, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: false,
      });
      if (uploadError) throw uploadError;

      const previousPath = student.resumeStoragePath;
      const updated = await students.updateByAuthUserId(req.user.id, {
        resumeFileName: path.basename(req.file.originalname),
        resumeStoragePath: uploadedPath,
        resumeMimeType: req.file.mimetype,
        resumeSize: req.file.size,
        resumeUploadedAt: new Date().toISOString(),
        resumeUrl: '/api/students/me/resume/file',
      });
      if (!updated) {
        await bucket.remove([uploadedPath]);
        return res.status(404).json({ success: false, message: 'Student profile not found.' });
      }
      if (previousPath) await bucket.remove([previousPath]).catch((error) => console.error('Failed to remove replaced resume:', error.message));
      return res.status(201).json({ success: true, message: 'Resume uploaded.', data: { resume: getStudentResumeMetadata(updated) } });
    } catch (error) {
      if (uploadedPath) await getBucket().remove([uploadedPath]).catch(() => {});
      return next(error);
    }
  },
];

const downloadResume = async (req, res, next) => {
  try {
    const student = await students.findByAuthUserId(req.user.id);
    if (!student?.resumeStoragePath || !student.resumeFileName) {
      return res.status(404).json({ success: false, message: 'No resume has been uploaded.' });
    }
    const { data, error } = await getBucket().download(student.resumeStoragePath);
    if (error) {
      if (error.message?.toLowerCase().includes('not found')) return res.status(404).json({ success: false, message: 'Resume file not found.' });
      throw error;
    }
    res.type(student.resumeMimeType || 'application/octet-stream');
    return res.attachment(student.resumeFileName).send(Buffer.from(await data.arrayBuffer()));
  } catch (error) { next(error); }
};

const deleteResume = async (req, res, next) => {
  try {
    const student = await students.findByAuthUserId(req.user.id);
    if (!student) return res.status(404).json({ success: false, message: 'Student profile not found.' });
    if (!student.resumeStoragePath) return res.status(404).json({ success: false, message: 'No resume has been uploaded.' });
    await students.updateByAuthUserId(req.user.id, {
      resumeUrl: null, resumeFileName: null, resumeStoragePath: null, resumeMimeType: null,
      resumeSize: null, resumeUploadedAt: null,
    });
    const { error } = await getBucket().remove([student.resumeStoragePath]);
    if (error) console.error('Failed to remove deleted resume object:', error.message);
    return res.json({ success: true, message: 'Resume deleted.' });
  } catch (error) { next(error); }
};

function normalizeSkills(skills) {
  const unique = new Map();
  for (const skill of skills || []) {
    const value = String(skill).trim();
    if (value) unique.set(value.toLowerCase(), value);
  }
  return [...unique.values()];
}

module.exports = { getProfile, updateProfile, getSkills, updateSkills, uploadResume, downloadResume, deleteResume };
