const http = require("http");
const connectDB = require("./config/database");
const config = require("./config/config");
const createApp = require("./app");
// ...existing code...
const Logger = require("./utils/logger");
const cron = require("node-cron");
const Loan = require("./models/Loan");
const cors = require("cors");

// Handle uncaught exceptions
process.on("uncaughtException", (err) => {
  Logger.error("Uncaught Exception! 💥 Shutting down...", err);
  process.exit(1);
});

// Connect to database
connectDB();

// Create HTTP server
const server = http.createServer();

// Create Express app (no socket middleware)
const app = createApp();

// Attach Express app to HTTP server
server.on("request", app);

// ...CORS is handled in app.js...

// Scheduled job to update overdue loans
cron.schedule("0 0 * * *", async () => {
  // Run daily at midnight
  try {
    Logger.info("Running scheduled job to update overdue loans...");
    const result = await Loan.updateMany(
      {
        status: "active",
        dueDate: { $lt: new Date() },
      },
      {
        $set: {
          status: "overdue",
          timestamp: new Date(),
        },
      }
    );
    if (result.modifiedCount > 0) {
      Logger.info(`Updated ${result.modifiedCount} loans to overdue status`);
      // WebSocket removed: previously emitted "overdue-loans-updated"
    }
  } catch (error) {
    Logger.error("Error in scheduled overdue loan update:", error);
  }
});

// Start server
const PORT = config.PORT;
server.listen(PORT, () => {
  Logger.info(`🚀 Server running in ${config.NODE_ENV} mode on port ${PORT}`);
  Logger.info(`📊 API endpoints available at http://localhost:${PORT}/api`);
  // Logger.info(`🔌 WebSocket server running`);
  Logger.info(
    `💾 Database: ${config.MONGO_URI.split("@")[1] || config.MONGO_URI}`
  );
});

// Remove socket.io: Do not initialize or use socket.io anywhere in this file

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
  Logger.error("Unhandled Promise Rejection! 💥 Shutting down...", err);
  server.close(() => {
    process.exit(1);
  });
});

// Handle SIGTERM
process.on("SIGTERM", () => {
  Logger.info("👋 SIGTERM received. Shutting down gracefully");
  server.close(() => {
    Logger.info("💥 Process terminated!");
  });
});

module.exports = server;
