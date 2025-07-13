const asyncHandler = require("../../middleware/asyncHandler");
const Loan = require("../../models/Loan");
const Logger = require("../../utils/logger");
const { getUserCurrency } = require("../../utils/currencyUtils");

// @desc    Get top customers
// @route   GET /api/dashboard/top-customers
// @access  Private
const getTopCustomers = asyncHandler(async (req, res) => {
  try {
    // Get user currency information
    const currency = await getUserCurrency(req);

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
        currency,
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

module.exports = {
  getTopCustomers,
};
