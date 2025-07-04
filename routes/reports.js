const express = require("express");
const router = express.Router();
const {
  generateBusinessReport,
  generateCustomerReport,
  generateLoanPerformanceReport,
  generateFinancialSummaryReport,
} = require("../controllers/reportsController");
const { validateJWT } = require("../middleware/auth");

// @desc    Generate comprehensive business report
// @route   GET /api/reports/business-report
// @access  Private
// @params  ?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD&format=json|pdf
// Alias: /business for /business-report
router.get("/business", validateJWT, generateBusinessReport);
router.get("/business-report", validateJWT, generateBusinessReport);

// Alias: /customer for /customer-report
router.get("/customer", validateJWT, generateCustomerReport);
router.get("/customer-report", validateJWT, generateCustomerReport);

// @desc    Generate loan performance report
// @route   GET /api/reports/loan-performance
// @access  Private
// @params  ?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD&format=json|pdf
router.get("/loan-performance", validateJWT, generateLoanPerformanceReport);

// @desc    Generate financial summary report
// @route   GET /api/reports/financial-summary
// @access  Private
// @params  ?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD&format=json|pdf
router.get("/financial-summary", validateJWT, generateFinancialSummaryReport);

module.exports = router;
