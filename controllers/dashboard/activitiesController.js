const asyncHandler = require("../../middleware/asyncHandler");
const Customer = require("../../models/Customer");
const Loan = require("../../models/Loan");
const Logger = require("../../utils/logger");
const { getUserCurrency } = require("../../utils/currencyUtils");

// @desc    Get recent activities
// @route   GET /api/dashboard/recent-activities
// @access  Private
const getRecentActivities = asyncHandler(async (req, res) => {
  try {
    // Get user currency information
    const currency = await getUserCurrency(req);

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
        currency,
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

module.exports = {
  getRecentActivities,
};
