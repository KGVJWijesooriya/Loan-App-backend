const jwt = require("jsonwebtoken");
const config = require("../config/config");
const User = require("../models/User");
const Logger = require("../utils/logger");

// JWT Authentication middleware
const validateJWT = async (req, res, next) => {
  try {
    const token = req.header("Authorization");

    if (!token) {
      return res.status(401).json({
        success: false,
        error: "Access denied. No token provided.",
      });
    }

    // Remove 'Bearer ' prefix if present
    const actualToken = token.startsWith("Bearer ") ? token.slice(7) : token;

    // Verify token
    const decoded = jwt.verify(actualToken, config.JWT_SECRET);

    // Find user in database using userId field (not _id)
    const user = await User.findOne({ userId: decoded.userId }).select(
      "-password"
    );
    if (!user) {
      return res.status(401).json({
        success: false,
        error: "Invalid token. User not found.",
      });
    }

    // Add user to request object
    req.user = user;
    next();
  } catch (error) {
    Logger.error("JWT validation error:", error);

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        error: "Invalid token.",
      });
    }

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        error: "Token expired.",
      });
    }

    return res.status(500).json({
      success: false,
      error: "Server error during authentication.",
    });
  }
};

// Admin role validation middleware
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: "Authentication required.",
    });
  }

  if (req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      error: "Admin access required.",
    });
  }

  next();
};

// Manager or Admin role validation middleware
const requireManagerOrAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: "Authentication required.",
    });
  }

  if (!["admin", "manager"].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      error: "Manager or Admin access required.",
    });
  }

  next();
};

module.exports = {
  validateJWT,
  requireAdmin,
  requireManagerOrAdmin,
};
