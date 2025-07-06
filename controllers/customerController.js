const asyncHandler = require("../middleware/asyncHandler");
const Customer = require("../models/Customer");
const Loan = require("../models/Loan");
const Logger = require("../utils/logger");
const { getUserCurrency } = require("../utils/currencyUtils");
const {
  getPagination,
  createPaginationResponse,
  buildSearchQuery,
  buildSortQuery,
} = require("../utils/queryHelpers");

// @desc    Get customer by customerId
// @route   GET /api/customers/by-customer-id/:customerId
// @access  Public
const getCustomerByCustomerId = asyncHandler(async (req, res) => {
  // Get user currency information
  const currency = await getUserCurrency(req);

  const customer = await Customer.findOne({
    customerId: req.params.customerId,
  }).populate("activeLoansCount");
  if (!customer) {
    return res.status(404).json({
      success: false,
      error: "Customer not found",
    });
  }

  // Get customer's loans but exclude installments
  const loans = await Loan.find({ customer: customer._id })
    .select("-installments")
    .sort("-createdAt");

  Logger.info(`Retrieved customer by customerId: ${customer.customerId}`);
  res.status(200).json({
    success: true,
    data: {
      customer,
      loans,
      currency,
    },
  });
});

// @desc    Get all customers
// @route   GET /api/customers
// @access  Public
const getCustomers = asyncHandler(async (req, res) => {
  // Get user currency information
  const currency = await getUserCurrency(req);

  const { page, limit, skip } = getPagination(req.query);
  // Add customerId to the searchable fields for real-time search
  const searchQuery = buildSearchQuery(req.query, [
    "customerId",
    "fullName",
    "nic",
    "phone",
  ]);
  const sortQuery = buildSortQuery(req.query);

  const customers = await Customer.find(searchQuery)
    .populate("activeLoansCount")
    .sort(sortQuery)
    .limit(limit)
    .skip(skip);

  const total = await Customer.countDocuments(searchQuery);
  const pagination = createPaginationResponse(total, page, limit);

  Logger.info(`Retrieved ${customers.length} customers`);

  res.status(200).json({
    success: true,
    data: customers,
    pagination,
    currency,
  });
});

// @desc    Get single customer
// @route   GET /api/customers/:id
// @access  Public
const getCustomer = asyncHandler(async (req, res) => {
  // Get user currency information
  const currency = await getUserCurrency(req);

  const customer = await Customer.findById(req.params.id).populate(
    "activeLoansCount"
  );

  if (!customer) {
    return res.status(404).json({
      success: false,
      error: "Customer not found",
    });
  }

  // Get customer's loans
  const loans = await Loan.find({ customer: customer._id }).sort("-createdAt");

  Logger.info(`Retrieved customer: ${customer.fullName}`);

  res.status(200).json({
    success: true,
    data: {
      customer,
      loans,
      currency,
    },
  });
});

// @desc    Create new customer
// @route   POST /api/customers
// @access  Public
const createCustomer = asyncHandler(async (req, res) => {
  // Get user currency information
  const currency = await getUserCurrency(req);

  const customer = await Customer.create(req.body);

  Logger.info(`Created new customer: ${customer.fullName}`);

  res.status(201).json({
    success: true,
    data: customer,
    currency,
  });
});

// @desc    Update customer
// @route   PUT /api/customers/:id
// @access  Public
const updateCustomer = asyncHandler(async (req, res) => {
  // Get user currency information
  const currency = await getUserCurrency(req);

  let customer = await Customer.findById(req.params.id);

  if (!customer) {
    return res.status(404).json({
      success: false,
      error: "Customer not found",
    });
  }

  customer = await Customer.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  Logger.info(`Updated customer: ${customer.fullName}`);

  res.status(200).json({
    success: true,
    data: customer,
    currency,
  });
});

// @desc    Delete customer
// @route   DELETE /api/customers/:id
// @access  Public
const deleteCustomer = asyncHandler(async (req, res) => {
  const customer = await Customer.findById(req.params.id);

  if (!customer) {
    return res.status(404).json({
      success: false,
      error: "Customer not found",
    });
  }

  // Check if customer has active loans
  const activeLoans = await Loan.countDocuments({
    customer: customer._id,
    status: "active",
  });

  if (activeLoans > 0) {
    return res.status(400).json({
      success: false,
      error: "Cannot delete customer with active loans",
    });
  }

  await Customer.findByIdAndDelete(req.params.id);

  Logger.info(`Deleted customer: ${customer.fullName}`);

  res.status(200).json({
    success: true,
    data: {},
  });
});

// @desc    Get customer statistics
// @route   GET /api/customers/stats
// @access  Public
const getCustomerStats = asyncHandler(async (req, res) => {
  // Get user currency information
  const currency = await getUserCurrency(req);

  const totalCustomers = await Customer.countDocuments();
  const activeCustomers = await Customer.countDocuments({ status: "active" });
  const inactiveCustomers = await Customer.countDocuments({
    status: "inactive",
  });

  const stats = {
    totalCustomers,
    activeCustomers,
    inactiveCustomers,
  };

  res.status(200).json({
    success: true,
    data: stats,
    currency,
  });
});

module.exports = {
  getCustomers,
  getCustomer,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getCustomerStats,
  getCustomerByCustomerId,
};
