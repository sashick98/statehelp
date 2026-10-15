require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/database');

const PORT = process.env.PORT || 5000;

/**
 * Server Bootstrap
 * 
 * 1. Connects to MongoDB database instance.
 * 2. Starts Express HTTP listener on configured port.
 * 3. Sets up graceful shutdown listeners for SIGINT and SIGTERM.
 */
async function startServer() {
  try {
    // Connect to MongoDB
    await connectDB();

    const server = app.listen(PORT, () => {
      console.log(`=======================================================`);
      console.log(` Tamil Nadu State Helpline & Grievance Portal API`);
      console.log(` Port: http://localhost:${PORT}`);
      console.log(` Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(` Health Check: http://localhost:${PORT}/api/health`);
      console.log(`=======================================================`);
    });

    // Graceful shutdown
    const handleShutdown = (signal) => {
      console.log(`[Server]: Received ${signal}. Closing HTTP server gracefully...`);
      server.close(() => {
        console.log('[Server]: HTTP server closed. Process terminating.');
        process.exit(0);
      });
    };

    process.on('SIGINT', () => handleShutdown('SIGINT'));
    process.on('SIGTERM', () => handleShutdown('SIGTERM'));
  } catch (err) {
    console.error('[Server Bootstrap Failure]: Could not connect to database or start server.');
    console.error(err);
    process.exit(1);
  }
}

startServer();
