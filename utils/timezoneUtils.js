const moment = require("moment-timezone");

// Sri Lanka timezone
const SRI_LANKA_TIMEZONE = "Asia/Colombo";

/**
 * Set the default timezone to Sri Lanka
 */
const setSriLankaTimezone = () => {
  // Set moment default timezone
  moment.tz.setDefault(SRI_LANKA_TIMEZONE);

  // Set Node.js process timezone
  process.env.TZ = SRI_LANKA_TIMEZONE;

  console.log(`🕐 Timezone set to Sri Lanka (${SRI_LANKA_TIMEZONE})`);
  console.log(
    `🕐 Current time in Sri Lanka: ${getSriLankaTime().format(
      "YYYY-MM-DD HH:mm:ss"
    )}`
  );
};

/**
 * Get current time in Sri Lanka timezone
 * @returns {moment.Moment}
 */
const getSriLankaTime = () => {
  return moment.tz(SRI_LANKA_TIMEZONE);
};

/**
 * Get today's moment in Sri Lanka timezone (for date calculations)
 * @returns {moment.Moment}
 */
const getTodaySriLanka = () => {
  return moment.tz(SRI_LANKA_TIMEZONE);
};

/**
 * Get current date in Sri Lanka timezone as JavaScript Date object
 * @returns {Date}
 */
const getSriLankaDate = () => {
  return getSriLankaTime().toDate();
};

/**
 * Get start of day in Sri Lanka timezone
 * @param {Date|string|moment.Moment} date - Optional date, defaults to today
 * @returns {Date}
 */
const getSriLankaStartOfDay = (date = null) => {
  const sriLankaTime = date
    ? moment.tz(date, SRI_LANKA_TIMEZONE)
    : getSriLankaTime();
  return sriLankaTime.startOf("day").toDate();
};

/**
 * Get end of day in Sri Lanka timezone
 * @param {Date|string|moment.Moment} date - Optional date, defaults to today
 * @returns {Date}
 */
const getSriLankaEndOfDay = (date = null) => {
  const sriLankaTime = date
    ? moment.tz(date, SRI_LANKA_TIMEZONE)
    : getSriLankaTime();
  return sriLankaTime.endOf("day").toDate();
};

/**
 * Convert any date to Sri Lanka timezone
 * @param {Date|string|moment.Moment} date
 * @returns {moment.Moment}
 */
const toSriLankaTime = (date) => {
  return moment.tz(date, SRI_LANKA_TIMEZONE);
};

/**
 * Get Sri Lanka time zone info
 * @returns {object}
 */
const getSriLankaTimezoneInfo = () => {
  const now = getSriLankaTime();
  return {
    timezone: SRI_LANKA_TIMEZONE,
    currentTime: now.format("YYYY-MM-DD HH:mm:ss"),
    utcOffset: now.format("Z"),
    utcOffsetMinutes: now.utcOffset(),
    isDST: now.isDST(),
    zoneName: now.zoneAbbr(),
  };
};

/**
 * Get date range for a period in Sri Lanka timezone
 * @param {string} period - Period string like "7d", "30d", "3m", "1y"
 * @returns {object} - {start: Date, end: Date}
 */
const getSriLankaDateRange = (period) => {
  const now = getSriLankaTime();
  const end = now.clone().endOf("day");
  const start = now.clone();

  // Parse period string
  const periodRegex = /^(\d+)([dmy])$/;
  const match = period.match(periodRegex);

  if (!match) {
    // Default to 7 days if invalid period
    start.subtract(7, "days");
  } else {
    const [, value, unit] = match;
    const numValue = parseInt(value);

    switch (unit) {
      case "d":
        start.subtract(numValue, "days");
        break;
      case "m":
        start.subtract(numValue, "months");
        break;
      case "y":
        start.subtract(numValue, "years");
        break;
      default:
        start.subtract(7, "days");
    }
  }

  start.startOf("day");

  return {
    start: start.toDate(),
    end: end.toDate(),
  };
};

/**
 * Format date to Sri Lanka timezone string
 * @param {Date|string|moment.Moment} date
 * @param {string} format - moment.js format string
 * @returns {string}
 */
const formatSriLankaDate = (date, format = "YYYY-MM-DD HH:mm:ss") => {
  return toSriLankaTime(date).format(format);
};

/**
 * Check if a date is today in Sri Lanka timezone
 * @param {Date|string|moment.Moment} date
 * @returns {boolean}
 */
const isTodayInSriLanka = (date) => {
  const sriLankaDate = toSriLankaTime(date);
  const today = getSriLankaTime();
  return sriLankaDate.isSame(today, "day");
};

/**
 * Add days to a date in Sri Lanka timezone
 * @param {Date|string|moment.Moment} date
 * @param {number} days
 * @returns {Date}
 */
const addDaysInSriLanka = (date, days) => {
  return toSriLankaTime(date).add(days, "days").toDate();
};

/**
 * Calculate days between two dates in Sri Lanka timezone
 * @param {Date|string|moment.Moment} startDate
 * @param {Date|string|moment.Moment} endDate
 * @returns {number}
 */
const daysBetweenInSriLanka = (startDate, endDate) => {
  const start = toSriLankaTime(startDate);
  const end = toSriLankaTime(endDate);
  return end.diff(start, "days");
};

module.exports = {
  SRI_LANKA_TIMEZONE,
  setSriLankaTimezone,
  getSriLankaTime,
  getTodaySriLanka,
  getSriLankaDate,
  getSriLankaStartOfDay,
  getSriLankaEndOfDay,
  toSriLankaTime,
  getSriLankaTimezoneInfo,
  getSriLankaDateRange,
  formatSriLankaDate,
  isTodayInSriLanka,
  addDaysInSriLanka,
  daysBetweenInSriLanka,
};
