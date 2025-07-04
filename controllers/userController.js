const User = require("../models/User");
const fs = require("fs");
const path = require("path");

// Get available languages and currencies
exports.getPreferences = async (req, res) => {
  try {
    const preferences = {
      languages: [
        { code: "en", name: "English" },
        { code: "si", name: "සිංහල" },
      ],
      currencies: [
        { code: "USD", name: "US Dollar", symbol: "$" },
        { code: "LKR", name: "Sri Lankan Rupee", symbol: "Rs" },
      ],
    };
    res.json(preferences);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// View user profile by userId
exports.viewUser = async (req, res) => {
  try {
    const user = await User.findOne({ userId: req.params.id }).select(
      "-password"
    );
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// Edit user profile by userId
exports.editUser = async (req, res) => {
  try {
    const updateData = { ...req.body };

    // Validate language and currency if provided
    const validLanguages = ["en", "si"];
    const validCurrencies = ["USD", "LKR"];

    if (updateData.language && !validLanguages.includes(updateData.language)) {
      return res.status(400).json({ message: "Invalid language selection." });
    }

    if (updateData.currency && !validCurrencies.includes(updateData.currency)) {
      return res.status(400).json({ message: "Invalid currency selection." });
    }

    if (req.file) {
      updateData.profileImage = req.file.path.replace(/\\/g, "/");
    }
    // Remove password field if present
    delete updateData.password;
    const user = await User.findOneAndUpdate(
      { userId: req.params.id },
      { $set: updateData },
      { new: true, runValidators: true, context: "query" }
    ).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// Update user language and currency preferences specifically
exports.updatePreferences = async (req, res) => {
  try {
    const { language, currency } = req.body;
    const userId = req.params.id;

    // Validate language and currency if provided
    const validLanguages = ["en", "si"];
    const validCurrencies = ["USD", "LKR"];

    if (language && !validLanguages.includes(language)) {
      return res.status(400).json({
        success: false,
        message: "Invalid language selection. Supported languages: en, si",
      });
    }

    if (currency && !validCurrencies.includes(currency)) {
      return res.status(400).json({
        success: false,
        message: "Invalid currency selection. Supported currencies: USD, LKR",
      });
    }

    // Prepare update data
    const updateData = {};
    if (language) updateData.language = language;
    if (currency) updateData.currency = currency;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please provide language or currency to update",
      });
    }

    const user = await User.findOneAndUpdate(
      { userId: userId },
      { $set: updateData },
      { new: true, runValidators: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      message: "Preferences updated successfully",
      data: {
        userId: user.userId,
        language: user.language,
        currency: user.currency,
        updatedAt: new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error("Update preferences error:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
};
