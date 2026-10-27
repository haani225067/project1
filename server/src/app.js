const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const config = require('./config/env');
const sanitizeInput = require('./middleware/sanitize');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');

const authRoutes = require('./routes/authRoutes');
const habitsRoutes = require('./routes/habitsRoutes');
const statsRoutes = require('./routes/statsRoutes');

const app = express();

// Security HTTP headers
app.use(helmet());

// CORS configuration - resilient to trailing slashes and multi-origins
const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. mobile apps, curl, or server-to-server tests)
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

// Undefined route 404 handler
app.use(notFound);

// Central error handler
app.use(errorHandler);

module.exports = app;
