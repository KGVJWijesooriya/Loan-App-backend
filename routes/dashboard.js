const express = require("express");
const router = express.Router();
const {
  getDashboardOverview,
  getRecentActivities,
  getFinancialAnalytics,
  getTopCustomers,
  getCollectionSummary,
  getOverdueLoans,
  getServerTime,
} = require("../controllers/dashboardController");

// Import authentication middleware
const { validateJWT } = require("../middleware/auth");

// @desc    Get dashboard overview statistics
// @route   GET /api/dashboard/overview
// @access  Private
router.get("/overview", validateJWT, getDashboardOverview);

// @desc    Get recent activities
// @route   GET /api/dashboard/recent-activities
// @access  Private
router.get("/recent-activities", validateJWT, getRecentActivities);

// @desc    Get financial analytics
// @route   GET /api/dashboard/financial-analytics
// @access  Private
router.get("/financial-analytics", validateJWT, getFinancialAnalytics);

// @desc    Get top customers
// @route   GET /api/dashboard/top-customers
// @access  Private
router.get("/top-customers", validateJWT, getTopCustomers);

// @desc    Get collection summary
// @route   GET /api/dashboard/collection-summary
// @access  Private
router.get("/collection-summary", validateJWT, getCollectionSummary);

// @desc    Get overdue loans list with pagination
// @route   GET /api/dashboard/overdue-loans
// @access  Private
router.get("/overdue-loans", validateJWT, getOverdueLoans);

// @desc    Get server time info for debugging
// @route   GET /api/dashboard/server-time
// @access  Private
router.get("/server-time", validateJWT, getServerTime);

module.exports = router;
