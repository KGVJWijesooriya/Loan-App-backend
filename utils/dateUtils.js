/**
 * Format date to YYYY-MM-DD
 * @param {Date} date
 * @returns {string}
 */
const formatDate = (date) => {
  if (!date) return null;
  return new Date(date).toISOString().split("T")[0];
};

/**
 * Calculate days between two dates
 * @param {Date} startDate
 * @param {Date} endDate
 * @returns {number}
 */
const daysBetween = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end - start);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

/**
 * Add days to a date
 * @param {Date} date
 * @param {number} days
 * @returns {Date}
 */
const addDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

/**
 * Check if date is overdue
 * @param {Date} dueDate
 * @returns {boolean}
 */
const isOverdue = (dueDate) => {
  return new Date() > new Date(dueDate);
};

/**
 * Get start and end of day
 * @param {Date} date
 * @returns {object}
 */
const getDateRangeForDay = (date) => {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);

  const end = new Date(date);
  end.setHours(23, 59, 59, 999);

  return { start, end };
};

/**
 * Get date range based on period string
 * @param {string} period - Period string like "7d", "30d", "3m", "1y"
 * @returns {object}
 */
const getDateRange = (period) => {
  const now = new Date();
  const end = new Date(now);
  const start = new Date(now);

  // Parse period string
  const periodRegex = /^(\d+)([dmy])$/;
  const match = period.match(periodRegex);

  if (!match) {
    // Default to 7 days if invalid period
    start.setDate(start.getDate() - 7);
  } else {
    const [, value, unit] = match;
    const numValue = parseInt(value);

    switch (unit) {
      case "d":
        start.setDate(start.getDate() - numValue);
        break;
      case "m":
        start.setMonth(start.getMonth() - numValue);
        break;
      case "y":
        start.setFullYear(start.getFullYear() - numValue);
        break;
      default:
        start.setDate(start.getDate() - 7);
    }
  }

  // Set to start and end of day
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);

  return { start, end };
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
