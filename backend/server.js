require('dotenv').config();

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');

const config = require('./src/config/config');
const { pool, initializeDatabase } = require('./src/config/initDb');
const { errorHandler, notFound } = require('./src/middleware/error.middleware');

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

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
    origin: [
      config.clientUrl,
      config.adminClientUrl,
      config.studentClientUrl || 'http://localhost:5173',
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:5175',
    ],
    credentials: true,
  })
);

// ── Body Parsers ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Health Check ──────────────────────────────────────────────────────────────
app.get('/api/health', async (req, res) => {
  let dbStatus = 'disconnected';
  try {
    const dbRes = await pool.query('SELECT NOW()');
    if (dbRes.rows.length > 0) dbStatus = 'connected';
  } catch (err) {
    dbStatus = `error: ${err.message}`;
  }

  res.json({
    success: true,
    message: 'RecruitX API is running',
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
    database: {
      status: dbStatus,
      type: 'PostgreSQL (Supabase)',
    },
  });
});

// ── API Routes ────────────────────────────────────────────────────────────────
app.use('/api/auth/admin', adminAuthRoutes);
app.use('/api/auth/student', studentAuthRoutes);
app.use('/api/auth/recruiter', recruiterAuthRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/recruiter', recruiterRoutes);
app.use('/api', sharedRoutes); // shared: /api/drives, /api/trainings, etc.

// ── Error Handling ────────────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ── Start Server ──────────────────────────────────────────────────────────────
const PORT = config.port;

async function startServer() {
  try {
    console.log('Connecting and verifying database schema...');
    await initializeDatabase();
    console.log('Database connected successfully!');
  } catch (err) {
    console.error('Database connection warning:', err.message);
  }

  const server = app.listen(PORT, () => {
    console.log(`
  ╔══════════════════════════════════════╗
  ║  RecruitX API Server                 ║
  ║  Running on: http://localhost:${PORT}  ║
  ║  Environment: ${config.nodeEnv.padEnd(22)}║
  ║  Database: PostgreSQL (Supabase)     ║
  ╚══════════════════════════════════════╝
    `);
  });

  server.on('error', (err) => {
    console.error('Server error:', err);
    if (err.code === 'EADDRINUSE') {
      console.error(`Port ${PORT} is already in use. Please stop the other process or use a different port.`);
    }
  });
}

if (process.env.NODE_ENV !== 'test') {
  startServer();
}

module.exports = app;
