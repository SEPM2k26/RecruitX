const fs = require('fs');
const path = require('path');
const { randomUUID } = require('crypto');
const multer = require('multer');

const resumeDirectory = path.resolve(__dirname, '../../uploads/resumes');
const allowedTypes = new Map([
  ['.pdf', ['application/pdf']],
  ['.doc', ['application/msword', 'application/octet-stream']],
  ['.docx', ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/octet-stream']],
]);

const storage = multer.diskStorage({
  destination(req, file, callback) {
    fs.mkdir(resumeDirectory, { recursive: true }, (error) => callback(error, resumeDirectory));
  },
  filename(req, file, callback) {
    const extension = path.extname(file.originalname).toLowerCase();
    callback(null, `${randomUUID()}${extension}`);
  },
});

const uploadResume = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter(req, file, callback) {
    const extension = path.extname(file.originalname).toLowerCase();
    const acceptedMimeTypes = allowedTypes.get(extension);
    if (!acceptedMimeTypes || !acceptedMimeTypes.includes(file.mimetype)) {
      const error = new Error('Resume must be a PDF, DOC, or DOCX file.');
      error.statusCode = 415;
      return callback(error);
    }
    callback(null, true);
  },
});

const removeStoredResume = async (filePath) => {
  if (!filePath) return;
  try {
    await fs.promises.unlink(filePath);
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
};

module.exports = { resumeDirectory, uploadResume, removeStoredResume };
