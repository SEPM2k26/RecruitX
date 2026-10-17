const path = require('path');
const multer = require('multer');

const allowedTypes = new Map([
  ['.pdf', ['application/pdf']],
  ['.doc', ['application/msword', 'application/octet-stream']],
  ['.docx', ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/octet-stream']],
]);

const uploadResume = multer({
  storage: multer.memoryStorage(),
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

module.exports = { uploadResume };
