const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { getUserCurrency } = require("../utils/currencyUtils");

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret";

exports.register = async (req, res) => {
  try {
    // Get user currency information (will default to USD for new registrations)
    const currency = await getUserCurrency(req);

    const {
      username,
      password,
      name,
      email,
      language,
      currency: reqCurrency,
    } = req.body;
    if (!username || !password) {
      return res
        .status(400)
        .json({ message: "Username and password are required." });
    }

    // Validate language and currency if provided
    const validLanguages = ["en", "si"];
    const validCurrencies = ["USD", "LKR"];

    if (language && !validLanguages.includes(language)) {
      return res.status(400).json({ message: "Invalid language selection." });
    }

    if (reqCurrency && !validCurrencies.includes(reqCurrency)) {
      return res.status(400).json({ message: "Invalid currency selection." });
    }

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(409).json({ message: "Username already exists." });
    }

    // Check if email already exists (if provided)
    if (email) {
      const existingEmail = await User.findOne({ email });
      if (existingEmail) {
        return res.status(409).json({ message: "Email already exists." });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const userData = {
      username,
      password: hashedPassword,
      language: language || "en", // Default to English
      currency: reqCurrency || "USD", // Default to USD
    };

    // Add optional fields if provided
    if (name) userData.name = name;
    if (email) userData.email = email;

    const user = new User(userData);
    await user.save();

    // Exclude password from response
    const { password: pw, __v, ...userResponse } = user.toObject();

    res.status(201).json({
      message: "User registered successfully.",
      user: userResponse,
      currency,
    });
  } catch (err) {
    console.error("Registration error:", err);
    res.status(500).json({
      message: "Server error.",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res
        .status(400)
        .json({ message: "Username and password are required." });
    }
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials." });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials." });
    }
    const token = jwt.sign(
      { userId: user.userId, username: user.username },
      JWT_SECRET,
      { expiresIn: "1d" }
    );
    // Exclude password from response
    const { password: pw, __v, ...userData } = user.toObject();
    res.json({
      token,
      user: userData,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error." });
  }
};
