const asyncHandler = require("../../middleware/asyncHandler");
const Loan = require("../../models/Loan");
const Logger = require("../../utils/logger");
const { getDateRange } = require("../../utils/dateUtils");
const { getUserCurrency } = require("../../utils/currencyUtils");

// @desc    Get financial analytics
// @route   GET /api/dashboard/financial-analytics
// @access  Private
const getFinancialAnalytics = asyncHandler(async (req, res) => {
  try {
    const { period = "7d" } = req.query;

    // Get user currency information
    const currency = await getUserCurrency(req);

    // Get date range based on period
    const dateRange = getDateRange(period);

    // Daily collections for the period (from both installments and payment history)
    const dailyCollections = await Loan.aggregate([
      {
        $facet: {
          // Installment payments in the period
          installmentPayments: [
            { $unwind: "$installments" },
            {
              $match: {
                "installments.paidDate": {
                  $gte: dateRange.start,
                  $lte: dateRange.end,
                },
                "installments.paidAmount": { $gt: 0 },
              },
            },
            {
              $group: {
                _id: {
                  year: { $year: "$installments.paidDate" },
                  month: { $month: "$installments.paidDate" },
                  day: { $dayOfMonth: "$installments.paidDate" },
                },
                totalAmount: { $sum: "$installments.paidAmount" },
                count: { $sum: 1 },
              },
            },
          ],
          // Payment history payments in the period
          paymentHistoryPayments: [
            {
              $match: {
                "paymentHistory.0": { $exists: true },
              },
            },
            { $unwind: "$paymentHistory" },
            {
              $match: {
                "paymentHistory.date": {
                  $gte: dateRange.start,
                  $lte: dateRange.end,
                },
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
          ],
        },
      },
      {
        $project: {
          combinedPayments: {
            $concatArrays: ["$installmentPayments", "$paymentHistoryPayments"],
          },
        },
      },
      { $unwind: "$combinedPayments" },
      {
        $group: {
          _id: "$combinedPayments._id",
          totalAmount: { $sum: "$combinedPayments.totalAmount" },
          count: { $sum: "$combinedPayments.count" },
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
        currency,
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

module.exports = {
  getFinancialAnalytics,
};
