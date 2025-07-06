const User = require("../models/User");
const Logger = require("./logger");

/**
 * Get currency symbol based on currency code
 * @param {string} currencyCode - The currency code (USD, LKR)
 * @returns {string} The currency symbol
 */
const getCurrencySymbol = (currencyCode) => {
  switch (currencyCode) {
    case "LKR":
      return "Rs.";
    case "USD":
    default:
      return "$";
  }
};

/**
 * Get user currency information from authenticated user
 * @param {Object} req - Express request object
 * @returns {Object} Currency object with code and symbol
 */
const getUserCurrency = async (req) => {
  let userCurrency = "USD";

  // Get user currency from authenticated user (optional - fallback to USD if no user)
  if (req.user && req.user._id) {
    try {
      const user = await User.findById(req.user._id).select("currency");
      userCurrency = user?.currency || "USD";
    } catch (userError) {
      Logger.warn(
        "Could not fetch user currency, using default USD:",
        userError
      );
    }
  }

  return {
    code: userCurrency,
    symbol: getCurrencySymbol(userCurrency),
  };
};

module.exports = {
  getCurrencySymbol,
  getUserCurrency,
};
