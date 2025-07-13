// Dashboard Controllers Index
// Centralized exports for all dashboard-related controllers

const { getDashboardOverview } = require("./overviewController");
const { getRecentActivities } = require("./activitiesController");
const { getFinancialAnalytics } = require("./analyticsController");
const { getTopCustomers } = require("./customersController");
const { getCollectionSummary } = require("./collectionController");
const { getOverdueLoans } = require("./overdueController");
const { getServerTime } = require("./serverTimeController");

module.exports = {
  // Overview Statistics
  getDashboardOverview,

  // Activities and History
  getRecentActivities,

  // Financial Analytics
  getFinancialAnalytics,

  // Customer Analytics
  getTopCustomers,

  // Collections Management
  getCollectionSummary,

  // Overdue Management
  getOverdueLoans,

  // System Information
  getServerTime,
};
