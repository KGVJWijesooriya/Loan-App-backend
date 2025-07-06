const asyncHandler = require("../middleware/asyncHandler");
const Customer = require("../models/Customer");
const Loan = require("../models/Loan");
const User = require("../models/User");
const Logger = require("../utils/logger");
const { getDateRange } = require("../utils/dateUtils");

// @desc    Get dashboard overview statistics
// @route   GET /api/dashboard/overview
// @access  Private (requires authentication)
const getDashboardOverview = asyncHandler(async (req, res) => {
  try {
    // Get current date for comparisons
    const now = new Date();
    const todayStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000 - 1);

    // Get this month's date range
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59
    );

    // Customer statistics
    const totalCustomers = await Customer.countDocuments();
    const activeCustomers = await Customer.countDocuments({
      status: "active",
    });
    const newCustomersToday = await Customer.countDocuments({
      createdAt: { $gte: todayStart, $lte: todayEnd },
    });
    const newCustomersThisMonth = await Customer.countDocuments({
      createdAt: { $gte: monthStart, $lte: monthEnd },
    });

    // Loan statistics
    const totalLoans = await Loan.countDocuments();
    const activeLoans = await Loan.countDocuments({
      status: "active",
    });
    const completedLoans = await Loan.countDocuments({
      status: "completed",
    });
    const overdueLoans = await Loan.countDocuments({
      status: "overdue",
    });
    const newLoansToday = await Loan.countDocuments({
      createdAt: { $gte: todayStart, $lte: todayEnd },
    });

    // Financial statistics
    const totalLoanAmount = await Loan.aggregate([
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    const activeLoanAmount = await Loan.aggregate([
      { $match: { status: "active" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    const totalRepayments = await Loan.aggregate([
      { $group: { _id: null, total: { $sum: "$paidAmount" } } },
    ]);

    const outstandingAmount = await Loan.aggregate([
      { $match: { status: { $in: ["active", "overdue"] } } },
      { $group: { _id: null, total: { $sum: "$remainingAmount" } } },
    ]);

    // Daily collections for today
    const todayCollections = await Loan.aggregate([
      {
        $match: {
          "paymentHistory.date": { $gte: todayStart, $lte: todayEnd },
        },
      },
      { $unwind: "$paymentHistory" },
      {
        $match: {
          "paymentHistory.date": { $gte: todayStart, $lte: todayEnd },
        },
      },
      { $group: { _id: null, total: { $sum: "$paymentHistory.amount" } } },
    ]);

    // Payment method distribution
    const paymentMethodStats = await Loan.aggregate([
      { $group: { _id: "$paymentMethod", count: { $sum: 1 } } },
    ]);

    // Loan status distribution
    const loanStatusStats = await Loan.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    Logger.info("Dashboard overview data retrieved successfully");

    res.status(200).json({
      success: true,
      data: {
        customers: {
          total: totalCustomers,
          active: activeCustomers,
          newToday: newCustomersToday,
          newThisMonth: newCustomersThisMonth,
          inactive: totalCustomers - activeCustomers,
        },
        loans: {
          total: totalLoans,
          active: activeLoans,
          completed: completedLoans,
          overdue: overdueLoans,
          newToday: newLoansToday,
          pending: totalLoans - activeLoans - completedLoans - overdueLoans,
        },
        financials: {
          totalLoanAmount: totalLoanAmount[0]?.total || 0,
          activeLoanAmount: activeLoanAmount[0]?.total || 0,
          totalRepayments: totalRepayments[0]?.total || 0,
          outstandingAmount: outstandingAmount[0]?.total || 0,
          todayCollections: todayCollections[0]?.total || 0,
          collectionRate:
            totalRepayments[0]?.total && totalLoanAmount[0]?.total
              ? (
                  (totalRepayments[0].total / totalLoanAmount[0].total) *
                  100
                ).toFixed(2)
              : 0,
        },
        distributions: {
          paymentMethods: paymentMethodStats,
          loanStatus: loanStatusStats,
        },
        lastUpdated: new Date().toISOString(),
      },
    });
  } catch (error) {
    Logger.error("Error fetching dashboard overview:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch dashboard overview",
    });
  }
});

// @desc    Get recent activities
// @route   GET /api/dashboard/recent-activities
// @access  Private
const getRecentActivities = asyncHandler(async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    // Get recent loan applications
    const recentLoans = await Loan.find()
      .populate("customer", "fullName customerId")
      .sort({ createdAt: -1 })
      .limit(limit)
      .select("loanId amount status createdAt customer");

    // Get recent customer registrations
    const recentCustomers = await Customer.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .select("customerId fullName status createdAt");

    // Get recent repayments - check if there are any loans with payment history
    let recentRepayments = [];
    try {
      recentRepayments = await Loan.aggregate([
        { $match: { "paymentHistory.0": { $exists: true } } }, // Only loans with payment history
        { $unwind: "$paymentHistory" },
        { $sort: { "paymentHistory.date": -1 } },
        { $limit: limit },
        {
          $lookup: {
            from: "customers",
            localField: "customer",
            foreignField: "_id",
            as: "customerInfo",
          },
        },
        {
          $project: {
            loanId: 1,
            "paymentHistory.amount": 1,
            "paymentHistory.date": 1,
            "paymentHistory.method": 1,
            "paymentHistory.notes": 1,
            "customerInfo.fullName": 1,
            "customerInfo.customerId": 1,
          },
        },
      ]);
    } catch (paymentError) {
      Logger.error("Error fetching recent repayments:", paymentError);
      // Continue without recent repayments if there's an error
    }

    Logger.info("Recent activities retrieved successfully");

    res.status(200).json({
      success: true,
      data: {
        recentLoans,
        recentCustomers,
        recentRepayments,
      },
    });
  } catch (error) {
    Logger.error("Error fetching recent activities:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch recent activities",
      details: error.message,
    });
  }
});

// @desc    Get financial analytics
// @route   GET /api/dashboard/financial-analytics
// @access  Private
const getFinancialAnalytics = asyncHandler(async (req, res) => {
  try {
    const { period = "7d" } = req.query;

    // Get user currency from authenticated user
    const user = await User.findById(req.user.id).select("currency");
    const userCurrency = user?.currency || "USD";

    // Get date range based on period
    const dateRange = getDateRange(period);

    // Daily collections for the period
    const dailyCollections = await Loan.aggregate([
      { $unwind: "$paymentHistory" },
      {
        $match: {
          "paymentHistory.date": { $gte: dateRange.start, $lte: dateRange.end },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$paymentHistory.date" },
            month: { $month: "$paymentHistory.date" },
            day: { $dayOfMonth: "$paymentHistory.date" },
          },
          totalAmount: { $sum: "$paymentHistory.amount" },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } },
    ]);

    // Loan disbursements for the period
    const dailyDisbursements = await Loan.aggregate([
      {
        $match: {
          createdAt: { $gte: dateRange.start, $lte: dateRange.end },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
            day: { $dayOfMonth: "$createdAt" },
          },
          totalAmount: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } },
    ]);

    // Monthly trends (last 12 months)
    const monthlyTrends = await Loan.aggregate([
      {
        $match: {
          createdAt: { $gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          totalLoans: { $sum: 1 },
          totalAmount: { $sum: "$amount" },
          averageAmount: { $avg: "$amount" },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
      { $limit: 12 },
    ]);

    // Risk analysis
    const riskAnalysis = await Loan.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalAmount: { $sum: "$amount" },
          avgAmount: { $avg: "$amount" },
        },
      },
    ]);

    Logger.info("Financial analytics retrieved successfully");

    res.status(200).json({
      success: true,
      data: {
        dailyCollections,
        dailyDisbursements,
        monthlyTrends,
        riskAnalysis,
        period,
        dateRange,
        currency: userCurrency,
      },
    });
  } catch (error) {
    Logger.error("Error fetching financial analytics:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch financial analytics",
    });
  }
});

// @desc    Get top customers
// @route   GET /api/dashboard/top-customers
// @access  Private
const getTopCustomers = asyncHandler(async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const sortBy = req.query.sortBy || "totalBorrowed"; // totalBorrowed, totalRepaid, loanCount

    let sortField;
    switch (sortBy) {
      case "totalRepaid":
        sortField = "totalRepaid";
        break;
      case "loanCount":
        sortField = "loanCount";
        break;
      default:
        sortField = "totalBorrowed";
    }

    const topCustomers = await Loan.aggregate([
      {
        $group: {
          _id: "$customer",
          totalBorrowed: { $sum: "$amount" },
          totalRepaid: { $sum: "$paidAmount" },
          loanCount: { $sum: 1 },
          averageLoanAmount: { $avg: "$amount" },
          activeLoans: {
            $sum: {
              $cond: [{ $eq: ["$status", "active"] }, 1, 0],
            },
          },
        },
      },
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
          customerId: "$customerInfo.customerId",
          fullName: "$customerInfo.fullName",
          email: "$customerInfo.email",
          phone: "$customerInfo.phone",
          status: "$customerInfo.status",
          totalBorrowed: 1,
          totalRepaid: 1,
          loanCount: 1,
          averageLoanAmount: 1,
          activeLoans: 1,
          repaymentRate: {
            $cond: [
              { $gt: ["$totalBorrowed", 0] },
              {
                $multiply: [
                  { $divide: ["$totalRepaid", "$totalBorrowed"] },
                  100,
                ],
              },
              0,
            ],
          },
        },
      },
      { $sort: { [sortField]: -1 } },
      { $limit: limit },
    ]);

    Logger.info("Top customers retrieved successfully");

    res.status(200).json({
      success: true,
      data: {
        customers: topCustomers,
        sortBy,
        total: topCustomers.length,
      },
    });
  } catch (error) {
    Logger.error("Error fetching top customers:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch top customers",
    });
  }
});

// @desc    Get collection summary
// @route   GET /api/dashboard/collection-summary
// @access  Private
const getCollectionSummary = asyncHandler(async (req, res) => {
  try {
    const today = new Date();
    const todayStart = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000 - 1);

    // Today's collections
    const todayCollections = await Loan.aggregate([
      { $unwind: "$paymentHistory" },
      {
        $match: {
          "paymentHistory.date": { $gte: todayStart, $lte: todayEnd },
        },
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$paymentHistory.amount" },
          count: { $sum: 1 },
        },
      },
    ]);

    // Expected collections for today
    const expectedToday = await Loan.aggregate([
      {
        $match: {
          status: "active",
        },
      },
      { $unwind: "$installments" },
      {
        $match: {
          "installments.dueDate": { $gte: todayStart, $lte: todayEnd },
          "installments.status": { $in: ["pending", "partial"] },
        },
      },
      {
        $group: {
          _id: null,
          totalExpected: {
            $sum: {
              $subtract: [
                "$installments.installmentAmount",
                "$installments.paidAmount",
              ],
            },
          },
          count: { $sum: 1 },
        },
      },
    ]);

    // Overdue collections
    const overdueCollections = await Loan.aggregate([
      {
        $match: {
          status: "overdue",
        },
      },
      {
        $group: {
          _id: null,
          totalOverdue: { $sum: "$remainingAmount" },
          count: { $sum: 1 },
        },
      },
    ]);

    // Collection efficiency
    const collectionEfficiency =
      todayCollections[0]?.totalAmount && expectedToday[0]?.totalExpected
        ? (
            (todayCollections[0].totalAmount / expectedToday[0].totalExpected) *
            100
          ).toFixed(2)
        : 0;

    Logger.info("Collection summary retrieved successfully");

    res.status(200).json({
      success: true,
      data: {
        today: {
          collected: todayCollections[0]?.totalAmount || 0,
          expected: expectedToday[0]?.totalExpected || 0,
          count: todayCollections[0]?.count || 0,
          efficiency: collectionEfficiency,
        },
        overdue: {
          amount: overdueCollections[0]?.totalOverdue || 0,
          count: overdueCollections[0]?.count || 0,
        },
      },
    });
  } catch (error) {
    Logger.error("Error fetching collection summary:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch collection summary",
    });
  }
});

module.exports = {
  getDashboardOverview,
  getRecentActivities,
  getFinancialAnalytics,
  getTopCustomers,
  getCollectionSummary,
};
