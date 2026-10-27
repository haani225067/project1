const mongoose = require('mongoose');
const config = require('./env');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(config.MONGODB_URI, {
      serverSelectionTimeoutMS: 3000,
    });
    console.log(`[MongoDB] Connected successfully to host: ${conn.connection.host}`);
    return conn;
  } catch (error) {
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

    console.error(`[MongoDB] Connection error: ${error.message}`);
    if (config.NODE_ENV !== 'test') {
      process.exit(1);
    }
    throw error;
  }
};

module.exports = connectDB;
