const asyncHandler = require("../../middleware/asyncHandler");
const Loan = require("../../models/Loan");
const Logger = require("../../utils/logger");
const { getUserCurrency } = require("../../utils/currencyUtils");
const {
  getSriLankaDate,
  getSriLankaStartOfDay,
} = require("../../utils/timezoneUtils");

// @desc    Get overdue loans list with pagination
// @route   GET /api/dashboard/overdue-loans
// @access  Private
const getOverdueLoans = asyncHandler(async (req, res) => {
  try {
    // Get user currency information
    const currency = await getUserCurrency(req);

    // Pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Sorting parameters
    const sortBy = req.query.sortBy || "dueDate"; // dueDate, amount, customerName
    const sortOrder = req.query.sortOrder === "desc" ? -1 : 1;

    // Filter parameters
    const search = req.query.search || "";

    // Get current date for overdue calculations - use Sri Lanka timezone
    const today = getSriLankaDate();
    const todayStart = getSriLankaStartOfDay(today);

    // Build aggregation pipeline
    const pipeline = [
      {
        $match: {
          status: { $in: ["active", "overdue"] }, // Include both active and overdue loans
        },
      },
      { $unwind: "$installments" },
      {
        $match: {
          $or: [
            // Overdue installments (past due date and not fully paid)
            {
              "installments.dueDate": { $lt: todayStart },
              $expr: {
                $lt: [
                  { $ifNull: ["$installments.paidAmount", 0] },
                  "$installments.installmentAmount",
                ],
              },
            },
            // Explicitly marked as overdue
            { "installments.status": "overdue" },
          ],
        },
      },
      {
        $lookup: {
          from: "customers",
          localField: "customer",
          foreignField: "_id",
          as: "customerInfo",
        },
      },
      { $unwind: "$customerInfo" },
      {
        $addFields: {
          overdue: {
            amount: {
              $subtract: [
                "$installments.installmentAmount",
                { $ifNull: ["$installments.paidAmount", 0] },
              ],
            },
            days: {
              $divide: [
                { $subtract: [new Date(), "$installments.dueDate"] },
                24 * 60 * 60 * 1000, // Convert milliseconds to days
              ],
            },
          },
        },
      },
      {
        $project: {
          loanId: 1,
          amount: 1,
          status: 1,
          paymentFrequency: 1,
          customerId: "$customerInfo.customerId",
          customerName: "$customerInfo.fullName",
          customerPhone: "$customerInfo.phone",
          customerEmail: "$customerInfo.email",
          installmentNumber: "$installments.installmentNumber",
          installmentAmount: "$installments.installmentAmount",
          paidAmount: { $ifNull: ["$installments.paidAmount", 0] },
          dueDate: "$installments.dueDate",
          installmentStatus: "$installments.status",
          overdue: 1,
          createdAt: 1,
        },
      },
    ];

    // Add search filter if provided
    if (search) {
      pipeline.push({
        $match: {
          $or: [
            { loanId: { $regex: search, $options: "i" } },
            { customerName: { $regex: search, $options: "i" } },
            { customerId: { $regex: search, $options: "i" } },
            { customerPhone: { $regex: search, $options: "i" } },
          ],
        },
      });
    }

    // Add sorting
    let sortField;
    switch (sortBy) {
      case "amount":
        sortField = { "overdue.amount": sortOrder };
        break;
      case "customerName":
        sortField = { customerName: sortOrder };
        break;
      case "days":
        sortField = { "overdue.days": sortOrder };
        break;
      default:
        sortField = { dueDate: sortOrder };
    }
    pipeline.push({ $sort: sortField });

    // Get total count for pagination
    const totalPipeline = [...pipeline, { $count: "total" }];
    const totalResult = await Loan.aggregate(totalPipeline);
    const total = totalResult[0]?.total || 0;

    // Add pagination
    pipeline.push({ $skip: skip }, { $limit: limit });

    // Execute the main query
    const overdueLoans = await Loan.aggregate(pipeline);

    // Calculate pagination info
    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    // Calculate summary statistics
    const summaryPipeline = [
      {
        $match: {
          status: { $in: ["active", "overdue"] },
        },
      },
      { $unwind: "$installments" },
      {
        $match: {
          $or: [
            {
              "installments.dueDate": { $lt: todayStart },
              $expr: {
                $lt: [
                  { $ifNull: ["$installments.paidAmount", 0] },
                  "$installments.installmentAmount",
                ],
              },
            },
            { "installments.status": "overdue" },
          ],
        },
      },
      {
        $group: {
          _id: null,
          totalOverdueAmount: {
            $sum: {
              $subtract: [
                "$installments.installmentAmount",
                { $ifNull: ["$installments.paidAmount", 0] },
              ],
            },
          },
          totalOverdueCount: { $sum: 1 },
          avgOverdueDays: {
            $avg: {
              $divide: [
                { $subtract: [new Date(), "$installments.dueDate"] },
                24 * 60 * 60 * 1000,
              ],
            },
          },
        },
      },
    ];

    const summaryResult = await Loan.aggregate(summaryPipeline);
    const summary = summaryResult[0] || {
      totalOverdueAmount: 0,
      totalOverdueCount: 0,
      avgOverdueDays: 0,
    };

    Logger.info("Overdue loans retrieved successfully");

    res.status(200).json({
      success: true,
      data: {
        loans: overdueLoans,
        pagination: {
          current: page,
          total: totalPages,
          count: overdueLoans.length,
          totalRecords: total,
          hasNext,
          hasPrev,
          limit,
        },
        summary: {
          totalOverdueAmount: summary.totalOverdueAmount,
          totalOverdueCount: summary.totalOverdueCount,
          avgOverdueDays: Math.round(summary.avgOverdueDays || 0),
        },
        filters: {
          search,
          sortBy,
          sortOrder: sortOrder === 1 ? "asc" : "desc",
        },
        currency,
      },
    });
  } catch (error) {
    Logger.error("Error fetching overdue loans:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch overdue loans",
    });
  }
});

module.exports = {
  getOverdueLoans,
};
