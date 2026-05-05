require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');

const authRoutes         = require('./routes/auth.routes');
const userRoutes         = require('./routes/user.routes');
const noteRoutes         = require('./routes/note.routes');
const problemRoutes      = require('./routes/problem.routes');
const aptitudeRoutes     = require('./routes/aptitude.routes');
const companyRoutes      = require('./routes/company.routes');
const skillpathRoutes    = require('./routes/skillpath.routes');
const discussionRoutes   = require('./routes/discussion.routes');
const analyticsRoutes    = require('./routes/analytics.routes');
const applicationRoutes  = require('./routes/application.routes');
const announcementRoutes = require('./routes/announcement.routes');
const driveRoutes         = require('./routes/drive.routes');
const interviewRoutes    = require('./routes/interview.routes');
const debugRoutes        = require('./routes/debug.routes');
const directMsgRoutes    = require('./routes/directmessage.routes');

const app = express();

// Security headers
app.use(helmet());

// ── Rate limiting ──────────────────────────────────────────────────────────
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please wait a few minutes and try again.' },
  skip: (req) => req.path === '/health',
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  message: { error: 'Too many login attempts. Please wait 15 minutes.' },
});

app.use('/api/', generalLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// ── CORS ───────────────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// ── Health check ───────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'PRAGATI Backend', timestamp: new Date() });
});

// ── API routes ─────────────────────────────────────────────────────────────
app.use('/api/auth',          authRoutes);
app.use('/api/users',         userRoutes);
app.use('/api/notes',         noteRoutes);
app.use('/api/problems',      problemRoutes);
app.use('/api/aptitude',      aptitudeRoutes);
app.use('/api/companies',     companyRoutes);
app.use('/api/skillpath',     skillpathRoutes);
app.use('/api/discussions',   discussionRoutes);
app.use('/api/analytics',     analyticsRoutes);
app.use('/api/applications',  applicationRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/drives',         driveRoutes);
app.use('/api/interview',     interviewRoutes);
app.use('/api/debug',         debugRoutes);
app.use('/api/direct-messages', directMsgRoutes);

// ── Error handler ──────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('[Server Error]', err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
});

// ── 404 ────────────────────────────────────────────────────────────────────
app.use('*', (req, res) => res.status(404).json({ error: 'Route not found' }));

// ── Start ──────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB connected');
    app.listen(PORT, () => {
      console.log(`🚀 PRAGATI Backend running on port ${PORT}`);
      console.log(`   Rate limit: 500 req/15min (general), 30 req/15min (auth)`);
    });
  })
  .catch(err => {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  });

module.exports = app;