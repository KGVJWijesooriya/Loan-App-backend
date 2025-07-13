const mongoose = require("mongoose");

const customerSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
      maxlength: [100, "Full name cannot exceed 100 characters"],
    },
    nameWithInitials: {
      type: String,
      trim: true,
      maxlength: [100, "Name with initials cannot exceed 100 characters"],
    },
    shortName: {
      type: String,
      trim: true,
      maxlength: [100, "Short name cannot exceed 100 characters"],
    },
    dateOfBirth: {
      type: String,
      trim: true,
    },
    gender: {
      type: String,
      enum: ["male", "female", "other"],
      trim: true,
    },
    drivingLicense: {
      type: String,
      trim: true,
    },
    nic: {
      type: String,
      required: [true, "NIC is required"],
      unique: true,
      trim: true,
      uppercase: true,
      match: [/^\d{9}[VX]$|^\d{12}$/, "Please provide a valid NIC number"],
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
      match: [/^\+?[\d\s-()]{10,15}$/, "Please provide a valid phone number"],
    },
    primaryPhone: {
      type: String,
      trim: true,
    },
    secondaryPhone: {
      type: String,
      trim: true,
    },
    address: {
      type: String,
      trim: true,
      maxlength: [500, "Address cannot exceed 500 characters"],
    },
    homeAddress: {
      type: String,
      trim: true,
      maxlength: [500, "Home address cannot exceed 500 characters"],
    },
    workAddress: {
      type: String,
      trim: true,
      maxlength: [500, "Work address cannot exceed 500 characters"],
    },
    mainIncome: {
      type: String,
      trim: true,
    },
    otherIncome: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please provide a valid email",
      ],
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
    customerId: {
      type: String,
      unique: true,
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);
// Pre-save hook to generate unique customerId like CUS-0001
customerSchema.pre("save", async function (next) {
  if (this.isNew && !this.customerId) {
    // Find the customer with the highest customerId number
    const last = await this.constructor.findOne(
      { customerId: /^CUS-\d{4}$/ },
      {},
      { sort: { customerId: -1 } }
    );
    let nextNumber = 1;
    if (last && last.customerId) {
      const match = last.customerId.match(/CUS-(\d{4})/);
      if (match) {
        nextNumber = parseInt(match[1], 10) + 1;
      }
    }
    this.customerId = `CUS-${nextNumber.toString().padStart(4, "0")}`;
  }
  next();
});

// Virtual for active loans count
customerSchema.virtual("activeLoansCount", {
  ref: "Loan",
  localField: "_id",
  foreignField: "customer",
  count: true,
  match: { status: "active" },
});

// Index for better query performance
customerSchema.index({ nic: 1 });
customerSchema.index({ fullName: "text", phone: "text" });

module.exports = mongoose.model("Customer", customerSchema);
