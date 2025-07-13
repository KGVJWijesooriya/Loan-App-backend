const {
  getSriLankaTime,
  getSriLankaStartOfDay,
  getSriLankaEndOfDay,
  getSriLankaDateRange,
  toSriLankaTime,
  addDaysInSriLanka,
  daysBetweenInSriLanka,
  formatSriLankaDate,
} = require("./timezoneUtils");

/**
 * Format date to YYYY-MM-DD using Sri Lanka timezone
 * @param {Date} date
 * @returns {string}
 */
const formatDate = (date) => {
  if (!date) return null;
  return formatSriLankaDate(date, "YYYY-MM-DD");
};

/**
 * Calculate days between two dates using Sri Lanka timezone
 * @param {Date} startDate
 * @param {Date} endDate
 * @returns {number}
 */
const daysBetween = (startDate, endDate) => {
  return Math.abs(daysBetweenInSriLanka(startDate, endDate));
};

/**
 * Add days to a date using Sri Lanka timezone
 * @param {Date} date
 * @param {number} days
 * @returns {Date}
 */
const addDays = (date, days) => {
  return addDaysInSriLanka(date, days);
};

/**
 * Check if date is overdue using Sri Lanka timezone
 * @param {Date} dueDate
 * @returns {boolean}
 */
const isOverdue = (dueDate) => {
  const now = getSriLankaTime();
  const due = toSriLankaTime(dueDate);
  return now.isAfter(due);
};

/**
 * Get start and end of day using Sri Lanka timezone
 * @param {Date} date
 * @returns {object}
 */
const getDateRangeForDay = (date) => {
  return {
    start: getSriLankaStartOfDay(date),
    end: getSriLankaEndOfDay(date),
  };
};

/**
 * Get date range based on period string using Sri Lanka timezone
 * @param {string} period - Period string like "7d", "30d", "3m", "1y"
 * @returns {object}
 */
const getDateRange = (period) => {
  return getSriLankaDateRange(period);
};

/**
 * Calculate loan duration in days
 * @param {number} amount
 * @param {number} dailyPayment
 * @returns {number}
 */
const calculateLoanDuration = (amount, dailyPayment) => {
  return Math.ceil(amount / dailyPayment);
};

module.exports = {
  formatDate,
  daysBetween,
  addDays,
  isOverdue,
  getDateRange,
  getDateRangeForDay,
  calculateLoanDuration,
};
