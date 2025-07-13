const mongoose = require("mongoose");

const loanSchema = new mongoose.Schema(
  {
    loanId: {
      type: String,
      unique: true,
      required: false, // allow missing at creation, will be set in pre-save
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: [true, "Customer is required"],
    },
    amount: {
      type: Number,
      required: [true, "Loan amount is required"],
      min: [1, "Amount must be greater than 0"],
      max: [10000000, "Amount cannot exceed 10,000,000"],
    },
    paymentMethod: {
      type: String,
      enum: ["daily", "weekly", "monthly"],
      required: [true, "Payment method is required"],
      default: "daily",
    },
    duration: {
      type: Number,
      required: [true, "Duration is required"],
      min: [1, "Duration must be at least 1"],
    },
    additionalCharges: {
      type: Number,
      default: 0,
      min: [0, "Additional charges cannot be negative"],
    },
    installmentAmount: {
      type: Number,
      min: [1, "Installment amount must be greater than 0"],
      // Not required: will be set automatically based on payment method
    },
    issueDate: {
      type: Date,
      required: [true, "Issue date is required"],
      default: Date.now,
    },
    dueDate: {
      type: Date,
      required: [true, "Due date is required"],
    },
    status: {
      type: String,
      enum: ["active", "completed", "overdue", "defaulted"],
      default: "active",
    },
    interestRate: {
      type: Number,
      min: [0, "Interest rate cannot be negative"],
      max: [100, "Interest rate cannot exceed 100%"],
      default: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    paidAmount: {
      type: Number,
      default: 0,
      min: [0, "Paid amount cannot be negative"],
    },
    remainingAmount: {
      type: Number,
      default: function () {
        return this.totalAmount;
      },
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [1000, "Notes cannot exceed 1000 characters"],
    },
    paymentHistory: [
      {
        date: {
          type: Date,
          default: Date.now,
        },
        amount: {
          type: Number,
          required: true,
          min: [0, "Payment amount must be positive"],
        },
        method: {
          type: String,
          enum: ["cash", "bank_transfer", "check", "online"],
          default: "cash",
        },
        notes: String,
      },
    ],

    // Installments: automatically generated based on payment method and duration
    installments: [
      {
        installmentNumber: {
          type: Number,
          required: true,
        },
        installmentAmount: {
          type: Number,
          required: true,
          min: [0, "Installment amount must be positive"],
        },
        dueDate: {
          type: Date,
          required: true,
        },
        paidDate: {
          type: Date,
          default: null,
        },
        paidAmount: {
          type: Number,
          default: 0,
          min: [0, "Paid amount must be positive"],
        },
        status: {
          type: String,
          enum: ["pending", "paid", "partial", "overdue"],
          default: "pending",
        },
        notes: {
          type: String,
          trim: true,
          maxlength: [500, "Notes cannot exceed 500 characters"],
        },
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for days remaining
loanSchema.virtual("daysRemaining").get(function () {
  const today = new Date();
  const dueDate = new Date(this.dueDate);
  const diffTime = dueDate - today;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for completion percentage
loanSchema.virtual("completionPercentage").get(function () {
  return Math.round((this.paidAmount / this.totalAmount) * 100);
});

// Virtual for next due installment
loanSchema.virtual("nextDueInstallment").get(function () {
  if (!this.installments || !Array.isArray(this.installments)) {
    return null;
  }
  return this.installments.find(
    (installment) =>
      installment.status === "pending" || installment.status === "partial"
  );
});

// Virtual for overdue installments
loanSchema.virtual("overdueInstallments").get(function () {
  if (!this.installments || !Array.isArray(this.installments)) {
    return [];
  }
  return this.installments.filter(
    (installment) => installment.status === "overdue"
  );
});

// Virtual for paid installments count
loanSchema.virtual("paidInstallmentsCount").get(function () {
  if (!this.installments || !Array.isArray(this.installments)) {
    return 0;
  }
  return this.installments.filter(
    (installment) => installment.status === "paid"
  ).length;
});

// Method to make a payment on a specific installment
loanSchema.methods.makePayment = function (
  installmentNumber,
  amount,
  notes = "",
  paidDate = null
) {
  const installment = this.installments.find(
    (inst) => inst.installmentNumber === installmentNumber
  );

  if (!installment) {
    throw new Error("Installment not found");
  }

  const remainingAmount =
    installment.installmentAmount - installment.paidAmount;

  if (amount > remainingAmount) {
    throw new Error("Payment amount exceeds remaining installment amount");
  }

  if (amount <= 0) {
    throw new Error("Payment amount must be greater than 0");
  }

  // Update installment payment details
  installment.paidAmount += amount;
  installment.notes = notes;

  // Update installment status based on payment
  if (installment.paidAmount >= installment.installmentAmount) {
    installment.status = "paid";
    installment.paidDate = paidDate ? new Date(paidDate) : new Date();
  } else if (installment.paidAmount > 0) {
    installment.status = "partial";
  }

  // Add to payment history
  this.paymentHistory.push({
    date: paidDate ? new Date(paidDate) : new Date(),
    amount: amount,
    method: "cash", // default, can be updated
    notes: `Payment for installment ${installmentNumber}. ${notes}`,
  });

  // Recalculate loan totals
  this.paidAmount = this.installments.reduce((total, inst) => {
    return total + inst.paidAmount;
  }, 0);

  this.remainingAmount = this.totalAmount - this.paidAmount;

  // Update loan status if fully paid
  if (this.paidAmount >= this.totalAmount) {
    this.status = "completed";
  } else if (
    this.status === "completed" &&
    this.paidAmount < this.totalAmount
  ) {
    // If loan was completed but now has outstanding amount, revert to active
    this.status = "active";
  }

  return this.save();
};

// Counter schema for generating unique loan IDs
const counterSchema = new mongoose.Schema({
  _id: String,
  sequence_value: { type: Number, default: 0 },
});

const Counter = mongoose.model("Counter", counterSchema);

// Function to get next sequence number
async function getNextSequence(name) {
  const counter = await Counter.findByIdAndUpdate(
    name,
    { $inc: { sequence_value: 1 } },
    { new: true, upsert: true }
  );
  return counter.sequence_value;
}

// Helper function to generate installments based on payment method
function generateInstallments(loan, preservePayments = false) {
  const installments = [];
  const { paymentMethod, duration, totalAmount, issueDate } = loan;

  // Store existing payment data if preserving payments
  let existingPayments = {};
  if (preservePayments && loan.installments) {
    loan.installments.forEach((inst) => {
      // Only preserve payments that are within the new duration
      if (inst.installmentNumber <= duration) {
        existingPayments[inst.installmentNumber] = {
          paidDate: inst.paidDate,
          paidAmount: inst.paidAmount,
          status: inst.status,
          notes: inst.notes,
        };
      }
    });
  }

  // Calculate installment amount
  const installmentAmount = Math.ceil(totalAmount / duration);

  // Set the installment amount on the loan
  loan.installmentAmount = installmentAmount;

  // Generate installments based on payment method
  for (let i = 1; i <= duration; i++) {
    const dueDate = new Date(issueDate);

    switch (paymentMethod) {
      case "daily":
        dueDate.setDate(dueDate.getDate() + i);
        break;
      case "weekly":
        dueDate.setDate(dueDate.getDate() + i * 7);
        break;
      case "monthly":
        dueDate.setMonth(dueDate.getMonth() + i);
        // Handle month overflow (e.g., Jan 31 + 1 month should be Feb 28/29)
        if (dueDate.getDate() !== new Date(issueDate).getDate()) {
          dueDate.setDate(0); // Set to last day of previous month
        }
        break;
      default:
        dueDate.setDate(dueDate.getDate() + i);
    }

    // For the last installment, adjust amount to match exactly the total
    const isLastInstallment = i === duration;
    const currentInstallmentAmount = isLastInstallment
      ? totalAmount - installmentAmount * (duration - 1)
      : installmentAmount;

    // Get existing payment data for this installment number if preserving
    const existingPayment = preservePayments ? existingPayments[i] : null;

    installments.push({
      installmentNumber: i,
      installmentAmount: Math.max(0, currentInstallmentAmount), // Ensure non-negative
      dueDate: dueDate,
      paidDate: existingPayment?.paidDate || null,
      paidAmount: existingPayment?.paidAmount || 0,
      status: existingPayment?.status || "pending",
      notes: existingPayment?.notes || "",
    });
  }

  return installments;
}

// Pre-save middleware to generate unique loan ID
loanSchema.pre("save", async function (next) {
  if (this.isNew && !this.loanId) {
    try {
      const sequence = await getNextSequence("loan_id");
      this.loanId = `LON-${sequence.toString().padStart(4, "0")}`;
    } catch (error) {
      return next(error);
    }
  }
  next();
});

// Pre-save middleware to calculate total amount, installmentAmount, and generate installments
loanSchema.pre("save", function (next) {
  // Calculate total amount with interest and additional charges
  const interestAmount = (this.amount * this.interestRate) / 100;
  this.totalAmount =
    this.amount + interestAmount + (this.additionalCharges || 0);

  // Generate installments for new loans
  if (this.isNew) {
    this.installments = generateInstallments(this);
  }
  // Regenerate installments when payment method or duration changes, preserving payments
  else if (this.isModified("paymentMethod") || this.isModified("duration")) {
    this.installments = generateInstallments(this, true); // Preserve existing payments
  }
  // If amount, interest rate, or additional charges changed, recalculate installment amounts
  else if (
    this.isModified("amount") ||
    this.isModified("interestRate") ||
    this.isModified("additionalCharges")
  ) {
    // Update installment amounts but keep the same due dates and payment info
    const installmentAmount = Math.ceil(this.totalAmount / this.duration);
    this.installmentAmount = installmentAmount;

    this.installments.forEach((installment, index) => {
      const isLastInstallment = index === this.installments.length - 1;
      installment.installmentAmount = isLastInstallment
        ? this.totalAmount - installmentAmount * (this.installments.length - 1)
        : installmentAmount;
    });
  }

  // Set the overall due date as the last installment's due date
  if (this.installments.length > 0) {
    this.dueDate = this.installments[this.installments.length - 1].dueDate;
  }

  // Calculate paid amount from installments
  this.paidAmount = this.installments.reduce((total, installment) => {
    return total + installment.paidAmount;
  }, 0);

  // Calculate remaining amount
  this.remainingAmount = this.totalAmount - this.paidAmount;

  // Update status based on payment
  if (this.paidAmount >= this.totalAmount) {
    this.status = "completed";
  } else if (this.dueDate < new Date() && this.status === "active") {
    this.status = "overdue";
  }

  // Update installment statuses
  this.installments.forEach((installment) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to start of day for comparison
    const dueDate = new Date(installment.dueDate);
    dueDate.setHours(0, 0, 0, 0); // Set to start of day for comparison

    if (installment.paidAmount >= installment.installmentAmount) {
      installment.status = "paid";
      if (!installment.paidDate) {
        installment.paidDate = new Date();
      }
    } else if (installment.paidAmount > 0) {
      installment.status = "partial";
    } else if (dueDate < today) {
      installment.status = "overdue";
    } else {
      installment.status = "pending";
    }
  });

  next();
});

// Index for better query performance
loanSchema.index({ loanId: 1 });
loanSchema.index({ customer: 1 });
loanSchema.index({ status: 1 });
loanSchema.index({ issueDate: 1 });
loanSchema.index({ dueDate: 1 });
loanSchema.index({ "installments.dueDate": 1 });
loanSchema.index({ "installments.status": 1 });

module.exports = mongoose.model("Loan", loanSchema);
