const asyncHandler = require("../../middleware/asyncHandler");
const Loan = require("../../models/Loan");
const Logger = require("../../utils/logger");
const { getUserCurrency } = require("../../utils/currencyUtils");
const moment = require("moment-timezone");
const {
  getSriLankaDate,
  getSriLankaStartOfDay,
  getSriLankaEndOfDay,
  getSriLankaTimezoneInfo,
  getTodaySriLanka,
  SRI_LANKA_TIMEZONE,
} = require("../../utils/timezoneUtils");

// @desc    Get collection summary
// @route   GET /api/dashboard/collection-summary
// @access  Private
const getCollectionSummary = asyncHandler(async (req, res) => {
  try {
    // Get user currency information
    const currency = await getUserCurrency(req);

    // Allow override of date via query parameter (for debugging/specific date queries)
    let targetMoment;

    if (req.query.date) {
      // If date is provided, use it
      targetMoment = moment.tz(req.query.date, SRI_LANKA_TIMEZONE);
    } else if (req.query.forceToday === "true") {
      // Force today's date in Sri Lanka (for testing)
      targetMoment = moment.tz(SRI_LANKA_TIMEZONE);
    } else if (req.query.shiftHours) {
      // Shift the current time by specified hours (for testing timezone issues)
      const shiftHours = parseInt(req.query.shiftHours);
      targetMoment = moment.tz(SRI_LANKA_TIMEZONE).add(shiftHours, "hours");
    } else {
      // Default: use current Sri Lanka time
      targetMoment = getTodaySriLanka();
    }

    // Use Sri Lanka timezone with exact times: 00:00:00 AM to 11:59:59 PM
    // Use Sri Lanka timezone with exact times: 00:00:00 AM to 11:59:59 PM (as string, not Date)
    const todayStartStr = targetMoment
      .clone()
      .startOf("day")
      .format("YYYY-MM-DD 00:00:00");
    const todayEndStr = targetMoment
      .clone()
      .endOf("day")
      .format("YYYY-MM-DD 23:59:59");

    // Parse as local time (not UTC)
    const todayStart = moment
      .tz(todayStartStr, "YYYY-MM-DD HH:mm:ss", SRI_LANKA_TIMEZONE)
      .toDate();
    const todayEnd = moment
      .tz(todayEndStr, "YYYY-MM-DD HH:mm:ss", SRI_LANKA_TIMEZONE)
      .toDate();

    // Log for debugging (remove in production)
    Logger.info(
      `Collection summary for date: ${targetMoment.format("YYYY-MM-DD")}`
    );
    Logger.info(
      `Date range: ${todayStart.toISOString()} to ${todayEnd.toISOString()}`
    );
    Logger.info(`Sri Lanka timezone info:`, getSriLankaTimezoneInfo());

    // Today's collections - all payments received today using local time only
    // Today's collections - all payments received today using local time only
    const todayInstallmentPayments = await Loan.aggregate([
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
          totalAmount: { $sum: "$installments.paidAmount" },
          count: { $sum: 1 },
        },
      },
    ]);

    const todayPaymentHistoryPayments = await Loan.aggregate([
      { $match: { "paymentHistory.0": { $exists: true } } },
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

    const todayCollections = [
      {
        totalAmount:
          (todayInstallmentPayments[0]?.totalAmount || 0) +
          (todayPaymentHistoryPayments[0]?.totalAmount || 0),
        count:
          (todayInstallmentPayments[0]?.count || 0) +
          (todayPaymentHistoryPayments[0]?.count || 0),
      },
    ];

    // Expected collections for today (installments due today)
    const expectedToday = await Loan.aggregate([
      {
        $match: {
          status: { $in: ["active", "overdue"] }, // Include both active and overdue loans
        },
      },
      { $unwind: "$installments" },
      {
        $match: {
          "installments.dueDate": {
            $gte: todayStart,
            $lte: todayEnd,
          },
        },
      },
      {
        $group: {
          _id: null,
          totalExpected: { $sum: "$installments.installmentAmount" }, // Total installment amount due today
          count: { $sum: 1 },
        },
      },
    ]);

    // Weekly collections (last 7 days including target date)
    const weekStart = new Date(todayStart.getTime() - 6 * 24 * 60 * 60 * 1000);
    const weeklyCollections = await Loan.aggregate([
      {
        $facet: {
          // Installment payments in the week
          installmentPayments: [
            { $unwind: "$installments" },
            {
              $match: {
                "installments.paidDate": {
                  $gte: weekStart,
                  $lte: todayEnd,
                },
                "installments.paidAmount": { $gt: 0 },
              },
            },
            {
              $group: {
                _id: null,
                totalAmount: { $sum: "$installments.paidAmount" },
                count: { $sum: 1 },
              },
            },
          ],
          // Payment history payments in the week
          paymentHistoryPayments: [
            {
              $match: {
                "paymentHistory.0": { $exists: true },
              },
            },
            { $unwind: "$paymentHistory" },
            {
              $match: {
                "paymentHistory.date": { $gte: weekStart, $lte: todayEnd },
              },
            },
            {
              $group: {
                _id: null,
                totalAmount: { $sum: "$paymentHistory.amount" },
                count: { $sum: 1 },
              },
            },
          ],
        },
      },
      {
        $project: {
          totalAmount: {
            $add: [
              {
                $ifNull: [
                  { $arrayElemAt: ["$installmentPayments.totalAmount", 0] },
                  0,
                ],
              },
              {
                $ifNull: [
                  { $arrayElemAt: ["$paymentHistoryPayments.totalAmount", 0] },
                  0,
                ],
              },
            ],
          },
          count: {
            $add: [
              {
                $ifNull: [
                  { $arrayElemAt: ["$installmentPayments.count", 0] },
                  0,
                ],
              },
              {
                $ifNull: [
                  { $arrayElemAt: ["$paymentHistoryPayments.count", 0] },
                  0,
                ],
              },
            ],
          },
        },
      },
    ]);

    // Monthly collections (this month)
    const monthStart = targetMoment
      .clone()
      .startOf("month")
      .startOf("day")
      .toDate();
    const monthlyCollections = await Loan.aggregate([
      {
        $facet: {
          // Installment payments in the month
          installmentPayments: [
            { $unwind: "$installments" },
            {
              $match: {
                "installments.paidDate": {
                  $gte: monthStart,
                  $lte: todayEnd,
                },
                "installments.paidAmount": { $gt: 0 },
              },
            },
            {
              $group: {
                _id: null,
                totalAmount: { $sum: "$installments.paidAmount" },
                count: { $sum: 1 },
              },
            },
          ],
          // Payment history payments in the month
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
                  $gte: monthStart,
                  $lte: todayEnd,
                },
              },
            },
            {
              $group: {
                _id: null,
                totalAmount: { $sum: "$paymentHistory.amount" },
                count: { $sum: 1 },
              },
            },
          ],
        },
      },
      {
        $project: {
          totalAmount: {
            $add: [
              {
                $ifNull: [
                  { $arrayElemAt: ["$installmentPayments.totalAmount", 0] },
                  0,
                ],
              },
              {
                $ifNull: [
                  { $arrayElemAt: ["$paymentHistoryPayments.totalAmount", 0] },
                  0,
                ],
              },
            ],
          },
          count: {
            $add: [
              {
                $ifNull: [
                  { $arrayElemAt: ["$installmentPayments.count", 0] },
                  0,
                ],
              },
              {
                $ifNull: [
                  { $arrayElemAt: ["$paymentHistoryPayments.count", 0] },
                  0,
                ],
              },
            ],
          },
        },
      },
    ]);

    // Overdue collections - check for overdue installments, not just loan status
    const overdueCollections = await Loan.aggregate([
      {
        $match: {
          status: { $in: ["active", "overdue"] }, // Include both active and overdue loans
        },
      },
      { $unwind: "$installments" },
      {
        $match: {
          "installments.status": "overdue", // Look for overdue installments
        },
      },
      {
        $group: {
          _id: null,
          totalOverdue: {
            $sum: {
              $subtract: [
                "$installments.installmentAmount",
                { $ifNull: ["$installments.paidAmount", 0] },
              ],
            },
          },
          count: { $sum: 1 },
        },
      },
    ]);

    // Collection efficiency
    const collectedAmount = todayCollections[0]?.totalAmount || 0;
    const expectedAmount = expectedToday[0]?.totalExpected || 0;
    const collectionEfficiency =
      expectedAmount > 0
        ? ((collectedAmount / expectedAmount) * 100).toFixed(2)
        : collectedAmount > 0
        ? 100
        : 0; // If no expected but collected, show 100%

    // For debugging: Let's see what payment dates we actually have in the database
    const paymentDateAnalysis = await Loan.aggregate([
      {
        $facet: {
          // Get sample installment payment dates
          installmentDates: [
            { $unwind: "$installments" },
            {
              $match: {
                "installments.paidDate": { $exists: true },
                "installments.paidAmount": { $gt: 0 },
              },
            },
            {
              $project: {
                paidDate: "$installments.paidDate",
                paidDateISO: {
                  $dateToString: {
                    date: "$installments.paidDate",
                    format: "%Y-%m-%d %H:%M:%S",
                    timezone: "UTC",
                  },
                },
                paidDateSriLanka: {
                  $dateToString: {
                    date: "$installments.paidDate",
                    format: "%Y-%m-%d %H:%M:%S",
                    timezone: "Asia/Colombo",
                  },
                },
                amount: "$installments.paidAmount",
              },
            },
            { $sort: { paidDate: -1 } },
            { $limit: 10 },
          ],
          // Get sample payment history dates
          paymentHistoryDates: [
            {
              $match: {
                "paymentHistory.0": { $exists: true },
              },
            },
            { $unwind: "$paymentHistory" },
            {
              $project: {
                paymentDate: "$paymentHistory.date",
                paymentDateISO: {
                  $dateToString: {
                    date: "$paymentHistory.date",
                    format: "%Y-%m-%d %H:%M:%S",
                    timezone: "UTC",
                  },
                },
                paymentDateSriLanka: {
                  $dateToString: {
                    date: "$paymentHistory.date",
                    format: "%Y-%m-%d %H:%M:%S",
                    timezone: "Asia/Colombo",
                  },
                },
                amount: "$paymentHistory.amount",
              },
            },
            { $sort: { paymentDate: -1 } },
            { $limit: 10 },
          ],
        },
      },
    ]);

    // Get today's collected loan list
    const todayCollectedLoans = await Loan.aggregate([
      {
        $addFields: {
          installments: {
            $filter: {
              input: "$installments",
              as: "inst",
              cond: {
                $and: [
                  { $gt: ["$$inst.paidAmount", 0] },
                  { $gte: ["$$inst.paidDate", todayStart] },
                  { $lte: ["$$inst.paidDate", todayEnd] },
                ],
              },
            },
          },
          paymentHistory: {
            $filter: {
              input: "$paymentHistory",
              as: "ph",
              cond: {
                $and: [
                  { $gte: ["$$ph.date", todayStart] },
                  { $lte: ["$$ph.date", todayEnd] },
                ],
              },
            },
          },
        },
      },
      {
        $match: {
          $or: [
            { "installments.0": { $exists: true } },
            { "paymentHistory.0": { $exists: true } },
          ],
        },
      },
      {
        $project: {
          _id: 1,
          customer: 1,
          loanNumber: 1,
          amount: 1,
          status: 1,
          installments: 1,
          paymentHistory: 1,
        },
      },
      // Removed $sort stage to avoid MongoDB parallel arrays sort error
    ]);

    Logger.info("Collection summary retrieved successfully");

    res.status(200).json({
      success: true,
      data: {
        today: {
          collected: collectedAmount,
          expected: expectedAmount,
          count: todayCollections[0]?.count || 0,
          efficiency: parseFloat(collectionEfficiency),
        },
        overdue: {
          amount: overdueCollections[0]?.totalOverdue || 0,
          count: overdueCollections[0]?.count || 0,
        },
        weekly: {
          collected: weeklyCollections[0]?.totalAmount || 0,
          count: weeklyCollections[0]?.count || 0,
        },
        monthly: {
          collected: monthlyCollections[0]?.totalAmount || 0,
          count: monthlyCollections[0]?.count || 0,
        },
        currency,
        timezone: getSriLankaTimezoneInfo(),
        summary: {
          totalOutstanding: overdueCollections[0]?.totalOverdue || 0,
          collectionRate: collectionEfficiency,
          dailyTarget: expectedAmount,
          dailyAchievement: collectedAmount,
        },
        todayCollectedLoans,
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
  getCollectionSummary,
};
