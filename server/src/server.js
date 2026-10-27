const app = require('./app');
const connectDB = require('./config/db');
const config = require('./config/env');

const startServer = async () => {
  try {
    // Connect to database
    await connectDB();

    const server = app.listen(config.PORT, () => {
      console.log(
        `[Server] Habit Tracker API running in ${config.NODE_ENV} mode on http://localhost:${config.PORT}`
      );
    });

    // Graceful shutdown handling
    const gracefulShutdown = (signal) => {
      console.log(`\n[Server] Received ${signal}. Closing server gracefully...`);
      server.close(() => {
        console.log('[Server] HTTP server closed.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  } catch (error) {
    console.error(`[Server] Failed to initialize: ${error.message}`);
    process.exit(1);
  }
};

startServer();
