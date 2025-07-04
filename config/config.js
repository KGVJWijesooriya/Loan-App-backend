const dotenv = require("dotenv");

// Load environment variables
dotenv.config();

module.exports = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: process.env.PORT || 5000,
  MONGO_URI:
    process.env.MONGO_URI || "mongodb://localhost:27017/daily-loan-management",
  // Support multiple origins as array for CORS
  CORS_ORIGIN: process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(",")
    : ["http://localhost:3000"],
  SOCKET_CORS_ORIGIN: process.env.SOCKET_CORS_ORIGIN
    ? process.env.SOCKET_CORS_ORIGIN.split(",")
    : ["http://localhost:3000"],
  JWT_SECRET: process.env.JWT_SECRET || "fallback-secret-key",
  LOG_LEVEL: process.env.LOG_LEVEL || "info",
};
