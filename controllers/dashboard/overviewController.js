const asyncHandler = require("../../middleware/asyncHandler");
const Customer = require("../../models/Customer");
const Loan = require("../../models/Loan");
const Logger = require("../../utils/logger");
const { getUserCurrency } = require("../../utils/currencyUtils");
const {
  getSriLankaDate,
  getSriLankaStartOfDay,
  getSriLankaEndOfDay,
  getSriLankaTimezoneInfo,
  getSriLankaTime,
} = require("../../utils/timezoneUtils");

// @desc    Get dashboard overview statistics
// @route   GET /api/dashboard/overview
// @access  Private (requires authentication)
const getDashboardOverview = asyncHandler(async (req, res) => {
  try {
    // Get user currency information
    const currency = await getUserCurrency(req);

    // Get current date for comparisons using Sri Lanka timezone
    const now = getSriLankaDate();
    const todayStart = getSriLankaStartOfDay();
    const todayEnd = getSriLankaEndOfDay();

    // Get this month's date range using Sri Lanka timezone
    const monthStart = getSriLankaStartOfDay(
      new Date(now.getFullYear(), now.getMonth(), 1)
    );
    const monthEnd = getSriLankaEndOfDay(
      new Date(now.getFullYear(), now.getMonth() + 1, 0)
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

    // Daily collections for today (from both installments and payment history)
    const todayCollections = await Loan.aggregate([
      {
        $facet: {
          // Installment payments made today
          installmentPayments: [
            { $unwind: "$installments" },
            {
              $match: {
                "installments.paidDate": { $gte: todayStart, $lte: todayEnd },
                "installments.paidAmount": { $gt: 0 },
              },
            },
            {
              $group: {
                _id: null,
                total: { $sum: "$installments.paidAmount" },
              },
            },
          ],
          // Payment history payments made today
          paymentHistoryPayments: [
            {
              $match: {
                "paymentHistory.0": { $exists: true },
              },
            },
            { $unwind: "$paymentHistory" },
            {
              $match: {
                "paymentHistory.date": { $gte: todayStart, $lte: todayEnd },
              },
            },
            {
              $group: {
                _id: null,
                total: { $sum: "$paymentHistory.amount" },
              },
            },
          ],
        },
      },
      {
        $project: {
          total: {
            $add: [
              {
                $ifNull: [
                  { $arrayElemAt: ["$installmentPayments.total", 0] },
                  0,
                ],
              },
              {
                $ifNull: [
                  { $arrayElemAt: ["$paymentHistoryPayments.total", 0] },
                  0,
                ],
              },
            ],
          },
        },
      },
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
        currency,
        timezone: getSriLankaTimezoneInfo(),
        lastUpdated: getSriLankaTime().toISOString(),
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

module.exports = {
  getDashboardOverview,
};
