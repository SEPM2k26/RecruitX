require('dotenv').config();

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');

const config = require('./src/config/config');
const { errorHandler, notFound } = require('./src/middleware/error.middleware');

// Routes
const adminAuthRoutes = require('./src/routes/admin.auth.routes');
const adminRoutes = require('./src/routes/admin.routes');
const sharedRoutes = require('./src/routes/shared.routes');

const app = express();

// ── Security & Logging ────────────────────────────────────────────────────────
app.use(helmet());
app.use(morgan(config.nodeEnv === 'production' ? 'combined' : 'dev'));

// ── CORS ──────────────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: [config.clientUrl, config.adminClientUrl, 'http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175'],
    credentials: true,
  })
);

// ── Body Parsers ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Health Check ──────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'RecruitX API is running',
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
  });
});

// ── API Routes ────────────────────────────────────────────────────────────────
app.use('/api/auth/admin', adminAuthRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', sharedRoutes);  // shared: /api/drives, /api/trainings, etc.

// ── Error Handling ────────────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ── Start Server ──────────────────────────────────────────────────────────────
const PORT = config.port;
app.listen(PORT, () => {
  console.log(`
  ╔══════════════════════════════════════╗
  ║  RecruitX API Server                 ║
  ║  Running on: http://localhost:${PORT}  ║
  ║  Environment: ${config.nodeEnv.padEnd(22)}║
  ╚══════════════════════════════════════╝
  `);
});

module.exports = app;
