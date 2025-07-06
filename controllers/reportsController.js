const asyncHandler = require("../middleware/asyncHandler");
const Customer = require("../models/Customer");
const Loan = require("../models/Loan");
const User = require("../models/User");
const Logger = require("../utils/logger");
const { getUserCurrency } = require("../utils/currencyUtils");
const { getDateRange } = require("../utils/dateUtils");
const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");
const moment = require("moment");

// @desc    Generate comprehensive business report
// @route   GET /api/reports/business-report
// @access  Private (requires authentication)
const generateBusinessReport = asyncHandler(async (req, res) => {
  try {
    const { startDate, endDate, format = "json", period } = req.query;

    let dateRange;
    if (startDate && endDate) {
      // Use provided date range
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      dateRange = { start, end };
    } else {
      // Use period string or default to 30 days
      dateRange = getDateRange(period || "30d");
    }

    // Get comprehensive statistics
    const reportData = await getReportData(dateRange.start, dateRange.end);

    if (format === "pdf") {
      // Generate PDF report
      const pdfBuffer = await generatePDFReport(reportData, dateRange);

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="business-report-${moment().format(
          "YYYY-MM-DD"
        )}.pdf"`
      );
      res.send(pdfBuffer);
    } else {
      // Return JSON data
      res.json({
        success: true,
        data: {
          reportData,
          dateRange,
          generatedAt: new Date().toISOString(),
        },
      });
    }
  } catch (error) {
    Logger.error("Error generating business report:", error);
    res.status(500).json({
      success: false,
      error: "Failed to generate business report",
    });
  }
});

// @desc    Generate customer report
// @route   GET /api/reports/customer-report
// @access  Private (requires authentication)
const generateCustomerReport = asyncHandler(async (req, res) => {
  try {
    const { startDate, endDate, format = "json", period } = req.query;

    let dateRange;
    if (startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      dateRange = { start, end };
    } else {
      dateRange = getDateRange(period || "30d");
    }

    const customerData = await getCustomerReportData(
      dateRange.start,
      dateRange.end
    );

    if (format === "pdf") {
      const pdfBuffer = await generateCustomerPDFReport(
        customerData,
        dateRange
      );

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="customer-report-${moment().format(
          "YYYY-MM-DD"
        )}.pdf"`
      );
      res.send(pdfBuffer);
    } else {
      res.json({
        success: true,
        data: {
          customerData,
          dateRange,
          generatedAt: new Date().toISOString(),
        },
      });
    }
  } catch (error) {
    Logger.error("Error generating customer report:", error);
    res.status(500).json({
      success: false,
      error: "Failed to generate customer report",
    });
  }
});

// @desc    Generate loan performance report
// @route   GET /api/reports/loan-performance
// @access  Private (requires authentication)
const generateLoanPerformanceReport = asyncHandler(async (req, res) => {
  try {
    const { startDate, endDate, format = "json", period } = req.query;

    let dateRange;
    if (startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      dateRange = { start, end };
    } else {
      dateRange = getDateRange(period || "30d");
    }

    const loanData = await getLoanPerformanceData(
      dateRange.start,
      dateRange.end
    );

    if (format === "pdf") {
      const pdfBuffer = await generateLoanPerformancePDFReport(
        loanData,
        dateRange
      );

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="loan-performance-report-${moment().format(
          "YYYY-MM-DD"
        )}.pdf"`
      );
      res.send(pdfBuffer);
    } else {
      res.json({
        success: true,
        data: {
          loanData,
          dateRange,
          generatedAt: new Date().toISOString(),
        },
      });
    }
  } catch (error) {
    Logger.error("Error generating loan performance report:", error);
    res.status(500).json({
      success: false,
      error: "Failed to generate loan performance report",
    });
  }
});

// @desc    Generate financial summary report
// @route   GET /api/reports/financial-summary
// @access  Private (requires authentication)
const generateFinancialSummaryReport = asyncHandler(async (req, res) => {
  try {
    const { startDate, endDate, format = "json", period } = req.query;

    let dateRange;
    if (startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      dateRange = { start, end };
    } else {
      dateRange = getDateRange(period || "30d");
    }

    const financialData = await getFinancialSummaryData(
      dateRange.start,
      dateRange.end
    );

    if (format === "pdf") {
      const pdfBuffer = await generateFinancialSummaryPDFReport(
        financialData,
        dateRange
      );

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="financial-summary-report-${moment().format(
          "YYYY-MM-DD"
        )}.pdf"`
      );
      res.send(pdfBuffer);
    } else {
      res.json({
        success: true,
        data: {
          financialData,
          dateRange,
          generatedAt: new Date().toISOString(),
        },
      });
    }
  } catch (error) {
    Logger.error("Error generating financial summary report:", error);
    res.status(500).json({
      success: false,
      error: "Failed to generate financial summary report",
    });
  }
});

// Helper function to get comprehensive report data
const getReportData = async (startDate, endDate) => {
  const [
    customerStats,
    loanStats,
    financialStats,
    paymentMethodStats,
    loanStatusStats,
    monthlyTrends,
    overdueAnalysis,
    topCustomers,
  ] = await Promise.all([
    getCustomerStats(startDate, endDate),
    getLoanStats(startDate, endDate),
    getFinancialStats(startDate, endDate),
    getPaymentMethodStats(startDate, endDate),
    getLoanStatusStats(),
    getMonthlyTrends(startDate, endDate),
    getOverdueAnalysis(),
    getTopCustomers(startDate, endDate),
  ]);

  return {
    customerStats,
    loanStats,
    financialStats,
    paymentMethodStats,
    loanStatusStats,
    monthlyTrends,
    overdueAnalysis,
    topCustomers,
  };
};

// Helper function to get customer stats
const getCustomerStats = async (startDate, endDate) => {
  const [totalCustomers, activeCustomers, newCustomers, inactiveCustomers] =
    await Promise.all([
      Customer.countDocuments(),
      Customer.countDocuments({ status: "active" }),
      Customer.countDocuments({
        createdAt: { $gte: startDate, $lte: endDate },
      }),
      Customer.countDocuments({ status: "inactive" }),
    ]);

  return {
    totalCustomers,
    activeCustomers,
    newCustomers,
    inactiveCustomers,
  };
};

// Helper function to get loan stats
const getLoanStats = async (startDate, endDate) => {
  const [totalLoans, activeLoans, completedLoans, overdueLoans, newLoans] =
    await Promise.all([
      Loan.countDocuments(),
      Loan.countDocuments({ status: "active" }),
      Loan.countDocuments({ status: "completed" }),
      Loan.countDocuments({ status: "overdue" }),
      Loan.countDocuments({
        createdAt: { $gte: startDate, $lte: endDate },
      }),
    ]);

  return {
    totalLoans,
    activeLoans,
    completedLoans,
    overdueLoans,
    newLoans,
  };
};

// Helper function to get financial stats
const getFinancialStats = async (startDate, endDate) => {
  const [
    totalLoanAmount,
    activeLoanAmount,
    totalRepayments,
    outstandingAmount,
    recentCollections,
  ] = await Promise.all([
    Loan.aggregate([{ $group: { _id: null, total: { $sum: "$amount" } } }]),
    Loan.aggregate([
      { $match: { status: "active" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
    Loan.aggregate([{ $group: { _id: null, total: { $sum: "$paidAmount" } } }]),
    Loan.aggregate([
      { $match: { status: { $in: ["active", "overdue"] } } },
      { $group: { _id: null, total: { $sum: "$remainingAmount" } } },
    ]),
    Loan.aggregate([
      {
        $match: {
          "paymentHistory.date": { $gte: startDate, $lte: endDate },
        },
      },
      { $unwind: "$paymentHistory" },
      {
        $match: {
          "paymentHistory.date": { $gte: startDate, $lte: endDate },
        },
      },
      { $group: { _id: null, total: { $sum: "$paymentHistory.amount" } } },
    ]),
  ]);

  return {
    totalLoanAmount: totalLoanAmount[0]?.total || 0,
    activeLoanAmount: activeLoanAmount[0]?.total || 0,
    totalRepayments: totalRepayments[0]?.total || 0,
    outstandingAmount: outstandingAmount[0]?.total || 0,
    recentCollections: recentCollections[0]?.total || 0,
  };
};

// Helper function to get payment method stats
const getPaymentMethodStats = async (startDate, endDate) => {
  return await Loan.aggregate([
    { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
    { $group: { _id: "$paymentMethod", count: { $sum: 1 } } },
  ]);
};

// Helper function to get loan status stats
const getLoanStatusStats = async () => {
  return await Loan.aggregate([
    { $group: { _id: "$status", count: { $sum: 1 } } },
  ]);
};

// Helper function to get monthly trends
const getMonthlyTrends = async (startDate, endDate) => {
  return await Loan.aggregate([
    { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
    {
      $group: {
        _id: {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" },
        },
        totalLoans: { $sum: 1 },
        totalAmount: { $sum: "$amount" },
      },
    },
    { $sort: { "_id.year": 1, "_id.month": 1 } },
  ]);
};

// Helper function to get overdue analysis
const getOverdueAnalysis = async () => {
  return await Loan.aggregate([
    { $match: { status: "overdue" } },
    {
      $project: {
        amount: 1,
        remainingAmount: 1,
        dueDate: 1,
        daysPastDue: {
          $divide: [
            { $subtract: [new Date(), "$dueDate"] },
            1000 * 60 * 60 * 24,
          ],
        },
      },
    },
    {
      $group: {
        _id: null,
        totalOverdueAmount: { $sum: "$remainingAmount" },
        averageDaysPastDue: { $avg: "$daysPastDue" },
        count: { $sum: 1 },
      },
    },
  ]);
};

// Helper function to get top customers
const getTopCustomers = async (startDate, endDate) => {
  return await Loan.aggregate([
    { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
    {
      $group: {
        _id: "$customer",
        totalLoans: { $sum: 1 },
        totalAmount: { $sum: "$amount" },
        totalPaid: { $sum: "$paidAmount" },
      },
    },
    { $sort: { totalAmount: -1 } },
    { $limit: 10 },
    {
      $lookup: {
        from: "customers",
        localField: "_id",
        foreignField: "_id",
        as: "customerInfo",
      },
    },
    { $unwind: "$customerInfo" },
    {
      $project: {
        customerName: "$customerInfo.fullName",
        customerId: "$customerInfo.customerId",
        totalLoans: 1,
        totalAmount: 1,
        totalPaid: 1,
      },
    },
  ]);
};

// Helper function to get customer report data
const getCustomerReportData = async (startDate, endDate) => {
  const [customerStats, customerGrowth, customersByStatus] = await Promise.all([
    getCustomerStats(startDate, endDate),
    getCustomerGrowthData(startDate, endDate),
    getCustomersByStatus(),
  ]);

  return {
    customerStats,
    customerGrowth,
    customersByStatus,
  };
};

// Helper function to get customer growth data
const getCustomerGrowthData = async (startDate, endDate) => {
  return await Customer.aggregate([
    { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
    {
      $group: {
        _id: {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" },
        },
        newCustomers: { $sum: 1 },
      },
    },
    { $sort: { "_id.year": 1, "_id.month": 1 } },
  ]);
};

// Helper function to get customers by status
const getCustomersByStatus = async () => {
  return await Customer.aggregate([
    { $group: { _id: "$status", count: { $sum: 1 } } },
  ]);
};

// Helper function to get loan performance data
const getLoanPerformanceData = async (startDate, endDate) => {
  const [loanStats, performanceMetrics, repaymentAnalysis] = await Promise.all([
    getLoanStats(startDate, endDate),
    getLoanPerformanceMetrics(startDate, endDate),
    getRepaymentAnalysis(startDate, endDate),
  ]);

  return {
    loanStats,
    performanceMetrics,
    repaymentAnalysis,
  };
};

// Helper function to get loan performance metrics
const getLoanPerformanceMetrics = async (startDate, endDate) => {
  return await Loan.aggregate([
    { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
    {
      $group: {
        _id: null,
        averageLoanAmount: { $avg: "$amount" },
        averageRepaymentRate: { $avg: { $divide: ["$paidAmount", "$amount"] } },
        totalLoansIssued: { $sum: 1 },
        totalAmountIssued: { $sum: "$amount" },
      },
    },
  ]);
};

// Helper function to get repayment analysis
const getRepaymentAnalysis = async (startDate, endDate) => {
  return await Loan.aggregate([
    {
      $match: {
        "paymentHistory.date": { $gte: startDate, $lte: endDate },
      },
    },
    { $unwind: "$paymentHistory" },
    {
      $match: {
        "paymentHistory.date": { $gte: startDate, $lte: endDate },
      },
    },
    {
      $group: {
        _id: {
          year: { $year: "$paymentHistory.date" },
          month: { $month: "$paymentHistory.date" },
        },
        totalPayments: { $sum: "$paymentHistory.amount" },
        paymentCount: { $sum: 1 },
      },
    },
    { $sort: { "_id.year": 1, "_id.month": 1 } },
  ]);
};

// Helper function to get financial summary data
const getFinancialSummaryData = async (startDate, endDate) => {
  const [financialStats, cashFlow, profitability] = await Promise.all([
    getFinancialStats(startDate, endDate),
    getCashFlowData(startDate, endDate),
    getProfitabilityMetrics(startDate, endDate),
  ]);

  return {
    financialStats,
    cashFlow,
    profitability,
  };
};

// Helper function to get cash flow data
const getCashFlowData = async (startDate, endDate) => {
  return await Loan.aggregate([
    {
      $match: {
        $or: [
          { createdAt: { $gte: startDate, $lte: endDate } },
          { "paymentHistory.date": { $gte: startDate, $lte: endDate } },
        ],
      },
    },
    {
      $facet: {
        outflow: [
          { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
          { $group: { _id: null, total: { $sum: "$amount" } } },
        ],
        inflow: [
          { $unwind: "$paymentHistory" },
          {
            $match: {
              "paymentHistory.date": { $gte: startDate, $lte: endDate },
            },
          },
          { $group: { _id: null, total: { $sum: "$paymentHistory.amount" } } },
        ],
      },
    },
  ]);
};

// Helper function to get profitability metrics
const getProfitabilityMetrics = async (startDate, endDate) => {
  return await Loan.aggregate([
    { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
    {
      $group: {
        _id: null,
        totalInterestEarned: {
          $sum: {
            $multiply: ["$amount", { $divide: ["$interestRate", 100] }],
          },
        },
        totalAdditionalCharges: { $sum: "$additionalCharges" },
        totalPrincipal: { $sum: "$amount" },
      },
    },
  ]);
};

// PDF Generation Functions
const generatePDFReport = async (reportData, dateRange) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument();
      const chunks = [];

      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));

      // Header
      doc.fontSize(20).text("Business Report", { align: "center" });
      doc
        .fontSize(12)
        .text(`Generated: ${moment().format("MMMM Do YYYY, h:mm:ss a")}`, {
          align: "center",
        });
      doc.text(
        `Period: ${moment(dateRange.start).format("MMMM Do YYYY")} - ${moment(
          dateRange.end
        ).format("MMMM Do YYYY")}`,
        { align: "center" }
      );
      doc.moveDown();

      // Customer Statistics
      doc.fontSize(16).text("Customer Statistics", { underline: true });
      doc.fontSize(12);
      doc.text(`Total Customers: ${reportData.customerStats.totalCustomers}`);
      doc.text(`Active Customers: ${reportData.customerStats.activeCustomers}`);
      doc.text(`New Customers: ${reportData.customerStats.newCustomers}`);
      doc.text(
        `Inactive Customers: ${reportData.customerStats.inactiveCustomers}`
      );
      doc.moveDown();

      // Loan Statistics
      doc.fontSize(16).text("Loan Statistics", { underline: true });
      doc.fontSize(12);
      doc.text(`Total Loans: ${reportData.loanStats.totalLoans}`);
      doc.text(`Active Loans: ${reportData.loanStats.activeLoans}`);
      doc.text(`Completed Loans: ${reportData.loanStats.completedLoans}`);
      doc.text(`Overdue Loans: ${reportData.loanStats.overdueLoans}`);
      doc.text(`New Loans: ${reportData.loanStats.newLoans}`);
      doc.moveDown();

      // Financial Statistics
      doc.fontSize(16).text("Financial Statistics", { underline: true });
      doc.fontSize(12);
      doc.text(
        `Total Loan Amount: $${reportData.financialStats.totalLoanAmount.toLocaleString()}`
      );
      doc.text(
        `Active Loan Amount: $${reportData.financialStats.activeLoanAmount.toLocaleString()}`
      );
      doc.text(
        `Total Repayments: $${reportData.financialStats.totalRepayments.toLocaleString()}`
      );
      doc.text(
        `Outstanding Amount: $${reportData.financialStats.outstandingAmount.toLocaleString()}`
      );
      doc.text(
        `Recent Collections: $${reportData.financialStats.recentCollections.toLocaleString()}`
      );
      doc.moveDown();

      // Top Customers
      if (reportData.topCustomers.length > 0) {
        doc.fontSize(16).text("Top Customers", { underline: true });
        doc.fontSize(12);
        reportData.topCustomers.forEach((customer, index) => {
          doc.text(
            `${index + 1}. ${customer.customerName} (${customer.customerId})`
          );
          doc.text(
            `   Total Loans: ${
              customer.totalLoans
            }, Amount: $${customer.totalAmount.toLocaleString()}`
          );
        });
        doc.moveDown();
      }

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

const generateCustomerPDFReport = async (customerData, dateRange) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument();
      const chunks = [];

      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));

      // Header
      doc.fontSize(20).text("Customer Report", { align: "center" });
      doc
        .fontSize(12)
        .text(`Generated: ${moment().format("MMMM Do YYYY, h:mm:ss a")}`, {
          align: "center",
        });
      doc.text(
        `Period: ${moment(dateRange.start).format("MMMM Do YYYY")} - ${moment(
          dateRange.end
        ).format("MMMM Do YYYY")}`,
        { align: "center" }
      );
      doc.moveDown();

      // Customer Statistics
      doc.fontSize(16).text("Customer Overview", { underline: true });
      doc.fontSize(12);
      doc.text(`Total Customers: ${customerData.customerStats.totalCustomers}`);
      doc.text(
        `Active Customers: ${customerData.customerStats.activeCustomers}`
      );
      doc.text(`New Customers: ${customerData.customerStats.newCustomers}`);
      doc.text(
        `Inactive Customers: ${customerData.customerStats.inactiveCustomers}`
      );
      doc.moveDown();

      // Customer Growth
      if (customerData.customerGrowth.length > 0) {
        doc.fontSize(16).text("Customer Growth Trend", { underline: true });
        doc.fontSize(12);
        customerData.customerGrowth.forEach((growth) => {
          doc.text(
            `${growth._id.month}/${growth._id.year}: ${growth.newCustomers} new customers`
          );
        });
        doc.moveDown();
      }

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

const generateLoanPerformancePDFReport = async (loanData, dateRange) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument();
      const chunks = [];

      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));

      // Header
      doc.fontSize(20).text("Loan Performance Report", { align: "center" });
      doc
        .fontSize(12)
        .text(`Generated: ${moment().format("MMMM Do YYYY, h:mm:ss a")}`, {
          align: "center",
        });
      doc.text(
        `Period: ${moment(dateRange.start).format("MMMM Do YYYY")} - ${moment(
          dateRange.end
        ).format("MMMM Do YYYY")}`,
        { align: "center" }
      );
      doc.moveDown();

      // Loan Statistics
      doc.fontSize(16).text("Loan Overview", { underline: true });
      doc.fontSize(12);
      doc.text(`Total Loans: ${loanData.loanStats.totalLoans}`);
      doc.text(`Active Loans: ${loanData.loanStats.activeLoans}`);
      doc.text(`Completed Loans: ${loanData.loanStats.completedLoans}`);
      doc.text(`Overdue Loans: ${loanData.loanStats.overdueLoans}`);
      doc.text(`New Loans: ${loanData.loanStats.newLoans}`);
      doc.moveDown();

      // Performance Metrics
      if (loanData.performanceMetrics.length > 0) {
        const metrics = loanData.performanceMetrics[0];
        doc.fontSize(16).text("Performance Metrics", { underline: true });
        doc.fontSize(12);
        doc.text(
          `Average Loan Amount: $${
            metrics.averageLoanAmount?.toLocaleString() || 0
          }`
        );
        doc.text(
          `Average Repayment Rate: ${(
            (metrics.averageRepaymentRate || 0) * 100
          ).toFixed(2)}%`
        );
        doc.text(`Total Loans Issued: ${metrics.totalLoansIssued || 0}`);
        doc.text(
          `Total Amount Issued: $${
            metrics.totalAmountIssued?.toLocaleString() || 0
          }`
        );
        doc.moveDown();
      }

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

const generateFinancialSummaryPDFReport = async (financialData, dateRange) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument();
      const chunks = [];

      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));

      // Header
      doc.fontSize(20).text("Financial Summary Report", { align: "center" });
      doc
        .fontSize(12)
        .text(`Generated: ${moment().format("MMMM Do YYYY, h:mm:ss a")}`, {
          align: "center",
        });
      doc.text(
        `Period: ${moment(dateRange.start).format("MMMM Do YYYY")} - ${moment(
          dateRange.end
        ).format("MMMM Do YYYY")}`,
        { align: "center" }
      );
      doc.moveDown();

      // Financial Statistics
      doc.fontSize(16).text("Financial Overview", { underline: true });
      doc.fontSize(12);
      doc.text(
        `Total Loan Amount: $${financialData.financialStats.totalLoanAmount.toLocaleString()}`
      );
      doc.text(
        `Active Loan Amount: $${financialData.financialStats.activeLoanAmount.toLocaleString()}`
      );
      doc.text(
        `Total Repayments: $${financialData.financialStats.totalRepayments.toLocaleString()}`
      );
      doc.text(
        `Outstanding Amount: $${financialData.financialStats.outstandingAmount.toLocaleString()}`
      );
      doc.text(
        `Recent Collections: $${financialData.financialStats.recentCollections.toLocaleString()}`
      );
      doc.moveDown();

      // Cash Flow
      if (financialData.cashFlow.length > 0) {
        const cashFlow = financialData.cashFlow[0];
        doc.fontSize(16).text("Cash Flow", { underline: true });
        doc.fontSize(12);
        doc.text(
          `Total Outflow: $${cashFlow.outflow[0]?.total?.toLocaleString() || 0}`
        );
        doc.text(
          `Total Inflow: $${cashFlow.inflow[0]?.total?.toLocaleString() || 0}`
        );
        const netFlow =
          (cashFlow.inflow[0]?.total || 0) - (cashFlow.outflow[0]?.total || 0);
        doc.text(`Net Cash Flow: $${netFlow.toLocaleString()}`);
        doc.moveDown();
      }

      // Profitability
      if (financialData.profitability.length > 0) {
        const profitability = financialData.profitability[0];
        doc.fontSize(16).text("Profitability", { underline: true });
        doc.fontSize(12);
        doc.text(
          `Total Interest Earned: $${
            profitability.totalInterestEarned?.toLocaleString() || 0
          }`
        );
        doc.text(
          `Total Additional Charges: $${
            profitability.totalAdditionalCharges?.toLocaleString() || 0
          }`
        );
        doc.text(
          `Total Principal: $${
            profitability.totalPrincipal?.toLocaleString() || 0
          }`
        );
        doc.moveDown();
      }

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

module.exports = {
  generateBusinessReport,
  generateCustomerReport,
  generateLoanPerformanceReport,
  generateFinancialSummaryReport,
};
