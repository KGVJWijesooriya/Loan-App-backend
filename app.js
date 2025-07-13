const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const morgan = require("morgan");
const config = require("./config/config");
const errorHandler = require("./middleware/errorHandler");
const Logger = require("./utils/logger");

// Route imports
const customerRoutes = require("./routes/customers");
const loanRoutes = require("./routes/loans");
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const dashboardRoutes = require("./routes/dashboard");
const reportsRoutes = require("./routes/reports");
const dashboardTodayPaidInstallmentsRoutes = require("./routes/dashboard-today-paid-installments");

const createApp = () => {
  const app = express();

  // Security middleware
  // Fix: flatten connectSrc for multiple origins
  const connectSrc = ["'self'"].concat(
    Array.isArray(config.CORS_ORIGIN)
      ? config.CORS_ORIGIN
      : [config.CORS_ORIGIN]
  );
  app.use(
    helmet({
      crossOriginEmbedderPolicy: false,
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          connectSrc,
        },
      },
    })
  );

  // CORS configuration
  app.use(
    cors({
      origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps, curl, Postman)
        if (!origin) return callback(null, true);

        // If CORS_ORIGIN is '*', allow all origins
        if (config.CORS_ORIGIN.includes("*")) {
          return callback(null, true);
        }

        // Check if origin is in allowed list
        if (config.CORS_ORIGIN.includes(origin)) {
          return callback(null, true);
        }

        return callback(new Error("Not allowed by CORS"));
      },
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    })
  );

  // Compression middleware
  app.use(compression());

  // Logging middleware
  if (config.NODE_ENV === "development") {
    app.use(morgan("dev"));
  } else {
    app.use(morgan("combined"));
  }

  // Body parsing middleware
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));

  // Socket.IO middleware removed

  // Health check endpoint
  app.get("/health", (req, res) => {
    res.status(200).json({
      success: true,
      message: "Server is running",
      timestamp: new Date().toISOString(),
      environment: config.NODE_ENV,
    });
  });

  // API routes
  app.use("/api/auth", authRoutes);
  app.use("/api/customers", customerRoutes);
  app.use("/api/loans", loanRoutes);
  app.use("/api/users", userRoutes);
  app.use("/api/dashboard", dashboardRoutes);
  app.use("/api/reports", reportsRoutes);
  app.use("/api/dashboard", dashboardTodayPaidInstallmentsRoutes);

  // Serve static files
  app.use("/uploads/profileImages", express.static("uploads/profileImages"));
  app.use(express.static("public"));

  // Welcome route
  app.get("/", (req, res) => {
    res.json({
      success: true,
      message: "Daily Loan Management System API",
      version: "1.0.0",
      endpoints: {
        auth: "/api/auth",
        customers: "/api/customers",
        loans: "/api/loans",
        users: "/api/users",
        dashboard: "/api/dashboard",
        reports: "/api/reports",
        health: "/health",
      },
    });
  });

  // 404 handler
  app.use("*", (req, res) => {
    res.status(404).json({
      success: false,
      error: `Route ${req.originalUrl} not found`,
    });
  });

  // Global error handler
  app.use(errorHandler);

  return app;
};

module.exports = createApp;
