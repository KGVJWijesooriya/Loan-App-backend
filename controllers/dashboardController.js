// Dashboard Controller - Centralized imports from modular dashboard controllers
const {
  getDashboardOverview,
  getRecentActivities,
  getFinancialAnalytics,
  getTopCustomers,
  getCollectionSummary,
  getOverdueLoans,
  getServerTime,
} = require("./dashboard");

module.exports = {
  getDashboardOverview,
  getRecentActivities,
  getFinancialAnalytics,
  getTopCustomers,
  getCollectionSummary,
  getOverdueLoans,
  getServerTime,
};
