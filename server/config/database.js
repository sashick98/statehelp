const mongoose = require('mongoose');

/**
 * MongoDB Connection Handler
 * 
 * Data Flow Concept:
 * Express relies on Mongoose to provide an Object Data Modeling (ODM) layer
 * on top of raw MongoDB wire protocol.
 * 
 * 1. Reads connection string from environment variables (process.env.MONGODB_URI).
 * 2. Establishes connection pool to avoid opening/closing connections per request.
 * 3. Listens to connection lifecycle events for logging and health checks.
 */
const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/statehelp_tn';

  try {
    const conn = await mongoose.connect(uri, {
      autoIndex: true, // Automatically build indexes defined in schemas in dev mode
    });

    console.log(`[MongoDB Connected]: Host=${conn.connection.host}, Database=${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error(`[MongoDB Connection Error]: ${error.message}`);
    console.warn('[MongoDB Fallback]: Ensure local MongoDB service is running (e.g., mongod or Windows Service).');
    throw error;
  }
};

mongoose.connection.on('disconnected', () => {
  console.warn('[MongoDB Warning]: Disconnected from database.');
});

mongoose.connection.on('error', (err) => {
  console.error(`[MongoDB Runtime Error]: ${err.message}`);
});

module.exports = connectDB;
