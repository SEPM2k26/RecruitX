/**
 * Global error handler middleware
 * Must be registered last in Express app
 */
const errorHandler = (err, req, res, next) => {
  if (res.headersSent) return next(err);

  let statusCode = err.statusCode || err.status || 500;
  let message = err.message || 'Internal Server Error';
  if (err.type === 'entity.too.large' || err.code === 'LIMIT_FILE_SIZE') {
    statusCode = 413;
    message = 'The uploaded file or request is too large.';
  } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    statusCode = 400;
    message = 'Unexpected upload field. Use the "resume" file field.';
  }

  if (statusCode >= 500) {
    console.error(`[ERROR] ${err.stack || err.message}`);
    if (process.env.NODE_ENV !== 'development') message = 'Internal Server Error';
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && statusCode >= 500 && { stack: err.stack }),
  });
};

/**
 * 404 handler for unmatched routes
 */
const notFound = (req, res, next) => {
  const err = new Error(`Route not found: ${req.method} ${req.originalUrl}`);
  err.statusCode = 404;
  next(err);
};

module.exports = { errorHandler, notFound };
