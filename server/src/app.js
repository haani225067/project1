const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const config = require('./config/env');
const sanitizeInput = require('./middleware/sanitize');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');

const authRoutes = require('./routes/authRoutes');
const habitsRoutes = require('./routes/habitsRoutes');
const statsRoutes = require('./routes/statsRoutes');

const app = express();

// Security HTTP headers with assets policy relaxed for Vite bundled scripts & styles
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: false,
  })
);

// ---------------------------------------------------------------------------
// 1. Serve Frontend Static Assets First (Never blocked by API CORS checks)
// ---------------------------------------------------------------------------
const clientDistPath = path.resolve(__dirname, '../../client/dist');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
}

// ---------------------------------------------------------------------------
// 2. CORS configuration specifically for /api endpoints
// ---------------------------------------------------------------------------
const corsOptions = {
  origin: (origin, callback) => {
    // Same-origin browser requests, curl, or mobile requests have no origin header
    if (!origin) return callback(null, true);

    const cleanOrigin = origin.replace(/\/$/, '');
    const isRender = cleanOrigin.endsWith('.onrender.com');
    const isLocalhost = cleanOrigin.includes('localhost') || cleanOrigin.includes('127.0.0.1');

    const configuredOrigins = config.CLIENT_ORIGIN
      ? config.CLIENT_ORIGIN.split(',').map((o) => o.trim().replace(/\/$/, ''))
      : [];

    if (
      !config.CLIENT_ORIGIN ||
      config.CLIENT_ORIGIN === '*' ||
      isRender ||
      isLocalhost ||
      configuredOrigins.includes(cleanOrigin) ||
      config.NODE_ENV !== 'production'
    ) {
      return callback(null, true);
    }

    // Do not throw Error; simply omit Access-Control-Allow-Origin header
    return callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

// Mount CORS only on /api routes
app.use('/api', cors(corsOptions));

// Body parsers with payload size limit
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Sanitize request bodies and parameters against NoSQL operator injection
app.use(sanitizeInput);

// Health check endpoint (always accessible for Render keep-alive & monitoring)
app.get('/api/health', (req, res) => {
  const dbStatus =
    mongoose.connection.readyState === 1
      ? 'connected'
      : mongoose.connection.readyState === 2
      ? 'connecting'
      : 'disconnected';

  res.status(200).json({
    success: true,
    message: 'Habit Tracker API is healthy and operational',
    data: {
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      database: dbStatus,
    },
  });
});

// Database readiness check for API calls (excluding /health)
app.use('/api', (req, res, next) => {
  if (config.NODE_ENV === 'test') return next();
  if (req.path === '/health') return next();

  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      success: false,
      message:
        'Database connection in progress. If this message persists, please check your MONGODB_URI connection string in Render Dashboard Environment variables.',
      data: null,
    });
  }
  next();
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/habits', habitsRoutes);
app.use('/api/stats', statsRoutes);

// ---------------------------------------------------------------------------
// 3. SPA Fallback for client-side navigation (Dashboard, /habits, etc.)
// ---------------------------------------------------------------------------
if (fs.existsSync(clientDistPath)) {
  app.get('*', (req, res, next) => {
    // If it's an unmatched /api call, let notFound middleware handle it
    if (req.originalUrl.startsWith('/api')) {
      return next();
    }
    const indexFile = path.join(clientDistPath, 'index.html');
    if (fs.existsSync(indexFile)) {
      return res.sendFile(indexFile);
    }
    next();
  });
}

// Undefined route 404 handler (for unmatched /api calls)
app.use(notFound);

// Central error handler
app.use(errorHandler);

module.exports = app;
