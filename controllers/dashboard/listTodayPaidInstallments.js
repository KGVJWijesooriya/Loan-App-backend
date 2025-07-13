const Loan = require("../../models/Loan");
const moment = require("moment-timezone");
const {
  SRI_LANKA_TIMEZONE,
  getTodaySriLanka,
} = require("../../utils/timezoneUtils");

// @desc    List today's paid installments
// @route   GET /api/dashboard/today-paid-installments
// @access  Private
const listTodayPaidInstallments = async (req, res) => {
  try {
    let targetMoment;
    if (req.query.date) {
      targetMoment = moment.tz(req.query.date, SRI_LANKA_TIMEZONE);
    } else {
      targetMoment = getTodaySriLanka();
    }
    const todayStart = targetMoment.clone().startOf("day").toDate();
    const todayEnd = targetMoment.clone().endOf("day").toDate();

    // Find all installments paid today
    const results = await Loan.aggregate([
      { $unwind: "$installments" },
      {
        $match: {
          "installments.paidDate": { $gte: todayStart, $lte: todayEnd },
          "installments.paidAmount": { $gt: 0 },
        },
      },
      {
        $project: {
          _id: 0,
          loanId: "$_id",
          customer: 1,
          installment: "$installments",
        },
      },
      { $sort: { "installments.paidDate": -1 } },
    ]);

    res.status(200).json({
      success: true,
      count: results.length,
      data: results,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = { listTodayPaidInstallments };
