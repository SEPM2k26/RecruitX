require('dotenv').config();

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');

const config = require('./src/config/config');
const { errorHandler, notFound } = require('./src/middleware/error.middleware');

// Routes
const adminAuthRoutes = require('./src/routes/admin.auth.routes');
const studentAuthRoutes = require('./src/routes/student.auth.routes');
const recruiterAuthRoutes = require('./src/routes/recruiter.auth.routes');
const studentRoutes = require('./src/routes/student.routes');
const adminRoutes = require('./src/routes/admin.routes');
const recruiterRoutes = require('./src/routes/recruiter.routes');
const sharedRoutes = require('./src/routes/shared.routes');

const app = express();

// ── Security & Logging ────────────────────────────────────────────────────────
app.use(helmet());
app.use(morgan(config.nodeEnv === 'production' ? 'combined' : 'dev'));

// ── CORS ──────────────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: [config.clientUrl, config.adminClientUrl, config.studentClientUrl, config.recruiterClientUrl],
    credentials: true,
  })
);

// ── Body Parsers ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// ── Health Check ──────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'RecruitX API is running',
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
    dataMode: config.dataMode,
  });
});

// ── API Routes ────────────────────────────────────────────────────────────────
app.use('/api/auth/admin', adminAuthRoutes);
app.use('/api/auth/student', studentAuthRoutes);
app.use('/api/auth/recruiter', recruiterAuthRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/recruiter', recruiterRoutes);
app.use('/api', sharedRoutes);  // shared: /api/drives, /api/trainings, etc.

// ── Error Handling ────────────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ── Start Server ──────────────────────────────────────────────────────────────
const PORT = config.port;
// Bind to IPv4 loopback so local browsers and PowerShell can reach localhost
// consistently on Windows systems that resolve localhost to 127.0.0.1.
app.listen(PORT, '127.0.0.1', () => {
  console.log(`
  ╔══════════════════════════════════════╗
  ║  RecruitX API Server                 ║
  ║  Running on: http://localhost:${PORT}  ║
  ║  Environment: ${config.nodeEnv.padEnd(22)}║
  ╚══════════════════════════════════════╝
  `);
});

module.exports = app;
