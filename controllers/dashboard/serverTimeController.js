const asyncHandler = require("../../middleware/asyncHandler");
const Logger = require("../../utils/logger");
const {
  getSriLankaDate,
  getSriLankaStartOfDay,
  getSriLankaEndOfDay,
  getSriLankaTime,
  getSriLankaTimezoneInfo,
} = require("../../utils/timezoneUtils");

// @desc    Get server time info for debugging timezone issues
// @route   GET /api/dashboard/server-time
// @access  Private
const getServerTime = asyncHandler(async (req, res) => {
  try {
    const now = getSriLankaDate();
    const sriLankaTime = getSriLankaTime();

    // Sri Lanka time calculations
    const todayStart = getSriLankaStartOfDay();
    const todayEnd = getSriLankaEndOfDay();

    res.status(200).json({
      success: true,
      data: {
        serverTime: {
          current: sriLankaTime.format("YYYY-MM-DD HH:mm:ss"),
          currentISO: now.toISOString(),
          currentLocal: now.toString(),
          currentUTC: now.toUTCString(),
          timestamp: now.getTime(),
        },
        sriLankaTimezone: getSriLankaTimezoneInfo(),
        calculations: {
          todayStart: {
            iso: todayStart.toISOString(),
            local: todayStart.toString(),
            timestamp: todayStart.getTime(),
            sriLanka: sriLankaTime
              .clone()
              .startOf("day")
              .format("YYYY-MM-DD HH:mm:ss"),
          },
          todayEnd: {
            iso: todayEnd.toISOString(),
            local: todayEnd.toString(),
            timestamp: todayEnd.getTime(),
            sriLanka: sriLankaTime
              .clone()
              .endOf("day")
              .format("YYYY-MM-DD HH:mm:ss"),
          },
        },
        info: {
          note: "All times are now using Sri Lanka timezone (Asia/Colombo)",
          timezone: "Asia/Colombo",
          offset: sriLankaTime.format("Z"),
        },
      },
    });
  } catch (error) {
    Logger.error("Error fetching server time:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch server time",
    });
  }
});

module.exports = {
  getServerTime,
};
