const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
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

// Security HTTP headers
app.use(
  helmet({
    contentSecurityPolicy: false, // Allows flexible inline fonts & icons
  })
);

// CORS configuration - resilient to trailing slashes and multi-origins
const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. mobile apps, curl, or same-origin browser requests)
    if (!origin) return callback(null, true);

    const cleanOrigin = origin.replace(/\/$/, '');
    const configuredOrigins = config.CLIENT_ORIGIN
      ? config.CLIENT_ORIGIN.split(',').map((o) => o.trim().replace(/\/$/, ''))
      : [];

    const allowedOrigins = [
      ...configuredOrigins,
      'http://localhost:5173',
      'http://127.0.0.1:5173',
    ];

    if (
      config.CLIENT_ORIGIN === '*' ||
      allowedOrigins.includes(cleanOrigin) ||
      config.NODE_ENV !== 'production'
    ) {
      return callback(null, true);
    }
    return callback(new Error(`Cross-Origin Request Blocked by CORS policy: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
app.use(cors(corsOptions));

// Body parsers with payload size limit
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Sanitize request bodies and parameters against NoSQL operator injection
app.use(sanitizeInput);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Habit Tracker API is healthy and operational',
    data: {
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    },
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/habits', habitsRoutes);
app.use('/api/stats', statsRoutes);

// In production or when client/dist exists, serve frontend static assets
const clientDistPath = path.resolve(__dirname, '../../client/dist');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));

  // SPA fallback for all frontend client navigation
  app.get('*', (req, res, next) => {
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
