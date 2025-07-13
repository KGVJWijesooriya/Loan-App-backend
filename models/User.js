const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  userId: {
    type: String,
    unique: true,
    required: true,
  },
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    trim: true,
  },
  email: {
    type: String,
    trim: true,
    unique: true,
    sparse: true,
  },
  profileImage: {
    type: String, // Path to the uploaded image
  },
  language: {
    type: String,
    required: true,
    default: "en",
    enum: ["en", "si"], // English and Sinhala only
  },
  currency: {
    type: String,
    required: true,
    default: "USD",
    enum: ["USD", "LKR"], // USD and Sri Lankan Rupee only
  },
  theme: {
    type: String,
    required: true,
    default: "light",
    enum: ["light", "dark"], // Light and Dark themes only
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Pre-save hook to generate unique userId
userSchema.pre("validate", async function (next) {
  if (this.isNew && !this.userId) {
    let prefix = "usr"; // Default prefix for users without email

    // If email is provided, use first 3 characters as prefix
    if (this.email) {
      prefix = this.email.substring(0, 3).toLowerCase();
    } else if (this.username) {
      // If no email but username exists, use first 3 characters of username
      prefix = this.username.substring(0, 3).toLowerCase();
    }

    let userId = prefix + "0001";
    let counter = 1;
    const User = this.constructor;

    // Find existing userIds with this prefix
    while (await User.findOne({ userId })) {
      counter++;
      userId = prefix + counter.toString().padStart(4, "0");
    }
    this.userId = userId;
  }
  next();
});

module.exports = mongoose.model("User", userSchema);
