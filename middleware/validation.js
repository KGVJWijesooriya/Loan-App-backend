const Joi = require("joi");

// Customer validation schemas
const createCustomerSchema = Joi.object({
  fullName: Joi.string().required().trim().max(100),
  nic: Joi.string()
    .required()
    .trim()
    .uppercase()
    .pattern(/^\d{9}[VX]$|^\d{12}$/),
  // Accept either phone or primaryPhone
  phone: Joi.alternatives().try(
    Joi.string()
      .required()
      .trim()
      .pattern(/^\+?[\d\s-()]{10,15}$/),
    Joi.any().forbidden()
  ),
  primaryPhone: Joi.string()
    .trim()
    .pattern(/^\+?[\d\s-()]{10,15}$/),
  address: Joi.string().optional().trim().max(500),
  email: Joi.string().optional().trim().email(),
  status: Joi.string().valid("active", "inactive").default("active"),
  customerId: Joi.string().optional(),
  // Accept either address or homeAddress
  homeAddress: Joi.string().optional().trim().max(500),
  // Allow additional fields
  dateOfBirth: Joi.string().optional(),
  gender: Joi.string().optional(),
  mainIncome: Joi.string().optional(),
  otherIncome: Joi.string().optional(),
  secondaryPhone: Joi.string().optional(),
  workAddress: Joi.string().optional(),
  drivingLicense: Joi.string().optional(),
  nameWithInitials: Joi.string().optional(),
  shortName: Joi.string().optional(),
});

const updateCustomerSchema = Joi.object({
  fullName: Joi.string().optional().trim().max(100),
  nic: Joi.string()
    .optional()
    .trim()
    .uppercase()
    .pattern(/^\d{9}[VX]$|^\d{12}$/),
  phone: Joi.string()
    .optional()
    .trim()
    .pattern(/^\+?[\d\s-()]{10,15}$/),
  address: Joi.string().optional().trim().max(500),
  email: Joi.string().optional().trim().email(),
  status: Joi.string().valid("active", "inactive").optional(),
});

// Loan validation schemas
const createLoanSchema = Joi.object({
  customer: Joi.string().required().hex().length(24),
  amount: Joi.number().required().min(1).max(10000000),
  paymentMethod: Joi.string().valid("daily", "weekly", "monthly").required(),
  duration: Joi.number().required().min(1),
  issueDate: Joi.date().optional().iso().default(Date.now),
  dueDate: Joi.date().required().iso(),
  additionalCharges: Joi.number().optional().min(0).default(0),
  notes: Joi.string().optional().trim().max(1000),
  interestRate: Joi.number().optional().min(0).max(100).default(0),
  // dueDate is auto-calculated, loanId is auto-generated
});

const updateLoanSchema = Joi.object({
  customer: Joi.string().optional().hex().length(24),
  amount: Joi.number().optional().min(1).max(10000000),
  paymentMethod: Joi.string().valid("daily", "weekly", "monthly").optional(),
  duration: Joi.number().optional().min(1),
  issueDate: Joi.date().optional().iso(),
  dueDate: Joi.date().optional().iso(),
  additionalCharges: Joi.number().optional().min(0),
  status: Joi.string()
    .valid("active", "completed", "overdue", "defaulted")
    .optional(),
  interestRate: Joi.number().optional().min(0).max(100),
  notes: Joi.string().optional().trim().max(1000),
});

const addPaymentSchema = Joi.object({
  amount: Joi.number().required().min(0),
  method: Joi.string()
    .valid("cash", "bank_transfer", "check", "online")
    .default("cash"),
  notes: Joi.string().optional().allow("").trim().max(500),
});

// Installment validation schemas
const makeInstallmentPaymentSchema = Joi.object({
  amount: Joi.number().required().min(0.01),
  method: Joi.string()
    .valid("cash", "bank_transfer", "check", "online")
    .default("cash"),
  notes: Joi.string().optional().allow("").trim().max(500),
});

const updateInstallmentSchema = Joi.object({
  installmentAmount: Joi.number().optional().min(0.01),
  dueDate: Joi.date().optional().iso(),
  paidAmount: Joi.number().optional().min(0),
  paidDate: Joi.date().optional().iso(),
  notes: Joi.string().optional().allow("").trim().max(500),
});

const bulkPaymentSchema = Joi.object({
  totalAmount: Joi.number().required().min(0.01),
  method: Joi.string()
    .valid("cash", "bank_transfer", "check", "online")
    .default("cash"),
  notes: Joi.string().optional().allow("").trim().max(500),
  startFromInstallment: Joi.number().optional().min(1),
});

// Validation middleware
const validateSchema = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message,
      });
    }
    next();
  };
};

module.exports = {
  createCustomerSchema,
  updateCustomerSchema,
  createLoanSchema,
  updateLoanSchema,
  addPaymentSchema,
  makeInstallmentPaymentSchema,
  updateInstallmentSchema,
  bulkPaymentSchema,
  validateSchema,
};
