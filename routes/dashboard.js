const express = require("express");
const router = express.Router();
const {
  getDashboardOverview,
  getRecentActivities,
  getFinancialAnalytics,
  getTopCustomers,
  getCollectionSummary,
} = require("../controllers/dashboardController");

// Note: Add authentication middleware when available
// const { protect } = require("../middleware/auth");

// @desc    Get dashboard overview statistics
// @route   GET /api/dashboard/overview
// @access  Private
router.get("/overview", getDashboardOverview);

// @desc    Get recent activities
// @route   GET /api/dashboard/recent-activities
// @access  Private
router.get("/recent-activities", getRecentActivities);

// @desc    Get financial analytics
// @route   GET /api/dashboard/financial-analytics
// @access  Private
router.get("/financial-analytics", getFinancialAnalytics);

// @desc    Get top customers
// @route   GET /api/dashboard/top-customers
// @access  Private
router.get("/top-customers", getTopCustomers);

// @desc    Get collection summary
// @route   GET /api/dashboard/collection-summary
// @access  Private
router.get("/collection-summary", getCollectionSummary);

module.exports = router;
