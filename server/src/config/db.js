const mongoose = require('mongoose');
const config = require('./env');

let isConnecting = false;

const connectDB = async () => {
  if (mongoose.connection.readyState === 1 || isConnecting) {
    return;
  }

  isConnecting = true;

  try {
    const conn = await mongoose.connect(config.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`[MongoDB] Connected successfully to host: ${conn.connection.host}`);
    isConnecting = false;
    return conn;
  } catch (error) {
    isConnecting = false;
    console.error(`[MongoDB] Connection error: ${error.message}`);

    // If in development and connection to localhost failed, provide seamless in-memory fallback
    if (config.NODE_ENV !== 'production' && config.MONGODB_URI.includes('localhost')) {
      console.warn(
        `[MongoDB] Local MongoDB daemon not detected (${error.message}). Starting in-memory MongoDB fallback...`
      );
      try {
        const { MongoMemoryServer } = require('mongodb-memory-server');
        const memoryServer = await MongoMemoryServer.create({
          binary: { version: '6.0.14' },
          instance: { launchTimeout: 60000 },
        });
        const memoryUri = memoryServer.getUri();
        const conn = await mongoose.connect(memoryUri);
        console.log(`[MongoDB] In-memory database running and connected successfully at: ${memoryUri}`);
        return conn;
      } catch (memErr) {
        console.error(`[MongoDB] In-memory fallback failed: ${memErr.message}`);
      }
    }

    if (config.NODE_ENV === 'test') {
      throw error;
    }

    // In production, keep retrying so the HTTP server stays alive for health checks
    console.warn('[MongoDB] Will retry connection in 10 seconds. Please ensure MONGODB_URI in Render is your real Atlas connection string.');
    setTimeout(connectDB, 10000);
  }
};

module.exports = connectDB;
