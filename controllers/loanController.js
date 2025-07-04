const asyncHandler = require("../middleware/asyncHandler");
const Loan = require("../models/Loan");
const Customer = require("../models/Customer");
const Logger = require("../utils/logger");
const mongoose = require("mongoose");
const {
  getPagination,
  createPaginationResponse,
  buildSearchQuery,
  buildSortQuery,
} = require("../utils/queryHelpers");
const { addDays, calculateLoanDuration } = require("../utils/dateUtils");

// @desc    Get all loans
// @route   GET /api/loans
// @access  Public
const getLoans = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const searchQuery = buildSearchQuery(req.query);
  const sortQuery = buildSortQuery(req.query);

  // Add customer-specific search
  if (req.query.customer) {
    searchQuery.customer = req.query.customer;
  }

  // Add loanId search
  if (req.query.loanId) {
    searchQuery.loanId = { $regex: req.query.loanId, $options: "i" };
  }

  // Add general search that includes loanId
  if (req.query.search) {
    searchQuery.$or = [
      { loanId: { $regex: req.query.search, $options: "i" } },
      { notes: { $regex: req.query.search, $options: "i" } },
    ];
  }

  const loans = await Loan.find(searchQuery)
    .populate("customer", "fullName nic phone customerId")
    .sort(sortQuery)
    .limit(limit)
    .skip(skip)
    .lean();
  // Map only required fields for each loan
  const filteredLoans = loans.map((loan) => {
    let installmentAmount = null;
    let completionPercentage = 0;
    if (loan.duration && loan.totalAmount) {
      installmentAmount =
        Math.round((loan.totalAmount / loan.duration) * 100) / 100;
    }
    if (
      typeof loan.paidAmount === "number" &&
      typeof loan.totalAmount === "number" &&
      loan.totalAmount > 0
    ) {
      completionPercentage = Math.round(
        (loan.paidAmount / loan.totalAmount) * 100
      );
    }
    return {
      loanId: loan.loanId,
      _id: loan._id,
      customerId: loan.customer.customerId,
      amount: loan.amount,
      paymentMethod: loan.paymentMethod,
      status: loan.status,
      installmentAmount,
      completionPercentage,
    };
  });

  const total = await Loan.countDocuments(searchQuery);
  const pagination = createPaginationResponse(total, page, limit);

  Logger.info(`Retrieved ${filteredLoans.length} loans`);

  res.status(200).json({
    success: true,
    data: filteredLoans,
    pagination,
  });
});
// });

// @desc    Get single loan
// @route   GET /api/loans/:id
// @access  Public
const getLoan = asyncHandler(async (req, res) => {
  const loan = await Loan.findById(req.params.id).populate("customer").lean();

  if (!loan) {
    return res.status(404).json({
      success: false,
      error: "Loan not found",
    });
  }

  // Calculate all next scheduled installment dates and installment amount
  let nextInstallmentDates = [];
  let completionPercentage = 0;
  let installmentAmount = null;
  let interestAmount = 0;

  if (loan.duration && loan.totalAmount) {
    installmentAmount =
      Math.round((loan.totalAmount / loan.duration) * 100) / 100;
  }

  // Calculate interest amount
  if (loan.amount && loan.interestRate) {
    interestAmount = (loan.amount * loan.interestRate) / 100;
  }

  // Calculate completionPercentage based on paidAmount and totalAmount
  if (
    typeof loan.paidAmount === "number" &&
    typeof loan.totalAmount === "number" &&
    loan.totalAmount > 0
  ) {
    completionPercentage = Math.round(
      (loan.paidAmount / loan.totalAmount) * 100
    );
  }
  // Optionally, keep nextInstallmentDates logic if needed elsewhere

  Logger.info(`Retrieved loan: ${loan._id}`);

  // Exclude installments from the response
  const { installments, ...loanWithoutInstallments } = loan;
  res.status(200).json({
    success: true,
    data: {
      ...loanWithoutInstallments,
      nextInstallmentDates,
      completionPercentage,
      installmentAmount,
      interestAmount,
    },
  });
});
// @desc    Create new loan
// @route   POST /api/loans
// @access  Public
// @desc    Get all installments for a loan
// @route   GET /api/loans/:id/installments
// @access  Public
const getInstallments = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 50,
    status,
    sortBy = "installmentNumber",
    sortOrder = "asc",
  } = req.query;
  const skip = (page - 1) * limit;

  const loan = await Loan.findById(req.params.id).populate(
    "customer",
    "fullName customerId phone"
  );

  if (!loan) {
    return res.status(404).json({
      success: false,
      error: "Loan not found",
    });
  }

  let installments = [...loan.installments];

  // Filter by status if provided
  if (status) {
    installments = installments.filter((inst) => inst.status === status);
  }

  // Sort installments
  installments.sort((a, b) => {
    let aValue = a[sortBy];
    let bValue = b[sortBy];

    if (sortBy === "dueDate" || sortBy === "paidDate") {
      aValue = new Date(aValue);
      bValue = new Date(bValue);
    }

    if (sortOrder === "desc") {
      return bValue > aValue ? 1 : -1;
    }
    return aValue > bValue ? 1 : -1;
  });

  // Pagination
  const totalInstallments = installments.length;
  const paginatedInstallments = installments.slice(
    skip,
    skip + parseInt(limit)
  );

  // Calculate summary
  const summary = {
    totalPaid: installments
      .filter((inst) => inst.status === "paid")
      .reduce((sum, inst) => sum + inst.paidAmount, 0),
    totalPending: installments
      .filter((inst) => inst.status === "pending")
      .reduce((sum, inst) => sum + inst.installmentAmount, 0),
    paidCount: installments.filter((inst) => inst.status === "paid").length,
    partialCount: installments.filter((inst) => inst.status === "partial")
      .length,
    pendingCount: installments.filter((inst) => inst.status === "pending")
      .length,
    overdueCount: installments.filter((inst) => inst.status === "overdue")
      .length,
  };

  Logger.info(
    `Retrieved ${paginatedInstallments.length} installments for loan: ${loan.loanId}`
  );

  res.status(200).json({
    success: true,
    data: {
      loanId: loan.loanId,
      totalInstallments: loan.installments.length,
      installments: paginatedInstallments,
      summary,
    },
    pagination: {
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalInstallments / limit),
      totalCount: totalInstallments,
      hasNext: skip + parseInt(limit) < totalInstallments,
      hasPrev: page > 1,
    },
  });
});

const createLoan = asyncHandler(async (req, res) => {
  // Extract and validate fields
  const {
    customer,
    amount,
    paymentMethod,
    duration,
    issueDate,
    dueDate,
    additionalCharges = 0,
    notes = "",
    interestRate,
  } = req.body;

  // Check if interestRate is missing or not a number
  if (
    interestRate === undefined ||
    interestRate === null ||
    isNaN(Number(interestRate))
  ) {
    return res.status(400).json({
      success: false,
      error: "Interest rate is required and must be a number",
    });
  }

  // Verify customer exists
  const customerDoc = await Customer.findById(customer);
  if (!customerDoc) {
    return res.status(404).json({
      success: false,
      error: "Customer not found",
    });
  }

  // Calculate totalAmount
  const interestAmount = (amount * Number(interestRate)) / 100;
  const totalAmount = amount + interestAmount + (additionalCharges || 0);

  // Build loan object
  const loanData = {
    customer,
    amount,
    paymentMethod,
    duration,
    issueDate,
    dueDate,
    additionalCharges,
    notes,
    interestRate: Number(interestRate),
    totalAmount,
  };

  const loan = await Loan.create(loanData);
  await loan.populate("customer", "fullName nic phone");

  // Add nextInstallmentDates (new loan will have no installments yet)
  let nextInstallmentDates = [];
  if (Array.isArray(loan.installments) && loan.installments.length > 0) {
    const now = new Date();
    nextInstallmentDates = loan.installments
      .filter(
        (inst) => !inst.collectedDate || new Date(inst.collectedDate) > now
      )
      .map((inst) => inst.collectedDate)
      .filter((date) => date != null)
      .sort((a, b) => new Date(a) - new Date(b));
  }

  Logger.info(
    `Created new loan: ${loan.loanId} (${loan._id}) for customer: ${customerDoc.fullName}`
  );

  res.status(201).json({
    success: true,
    data: { ...loan.toObject(), nextInstallmentDates },
  });
});

// @desc    Update loan
// @route   PUT /api/loans/:id
// @access  Public
const updateLoan = asyncHandler(async (req, res) => {
  let loan = await Loan.findById(req.params.id);

  if (!loan) {
    return res.status(404).json({
      success: false,
      error: "Loan not found",
    });
  }

  // Only allow fields that are in the Loan schema to be updated
  const allowedFields = [
    "customer",
    "amount",
    "interestRate",
    "paymentMethod",
    "duration",
    "issueDate",
    "dueDate",
    "additionalCharges",
    "notes",
  ];
  const updateData = {};
  for (const key of allowedFields) {
    if (req.body[key] !== undefined) {
      updateData[key] = req.body[key];
    }
  }

  // If customer is being updated, verify the customer exists
  if (updateData.customer) {
    const customerDoc = await Customer.findById(updateData.customer);
    if (!customerDoc) {
      return res.status(404).json({
        success: false,
        error: "Customer not found",
      });
    }
  }

  // If amount, interestRate, or additionalCharges are being updated, recalculate totalAmount
  let amount =
    updateData.amount !== undefined ? updateData.amount : loan.amount;
  let interestRate =
    updateData.interestRate !== undefined
      ? updateData.interestRate
      : loan.interestRate;
  let additionalCharges =
    updateData.additionalCharges !== undefined
      ? updateData.additionalCharges
      : loan.additionalCharges;
  if (
    updateData.amount !== undefined ||
    updateData.interestRate !== undefined ||
    updateData.additionalCharges !== undefined
  ) {
    const interestAmount = (amount * Number(interestRate)) / 100;
    updateData.totalAmount = amount + interestAmount + (additionalCharges || 0);
  }

  // Update the loan properties
  Object.assign(loan, updateData);

  // Save the loan to trigger pre-save middleware
  await loan.save();

  // Populate customer data with customerId
  await loan.populate("customer", "fullName nic phone customerId");

  Logger.info(`Updated loan: ${loan._id}`);

  // Exclude installments from the response, similar to getLoan function
  const { installments, ...loanWithoutInstallments } = loan.toObject();

  // Calculate interest amount
  let interestAmount = 0;
  if (loan.amount && loan.interestRate) {
    interestAmount = (loan.amount * loan.interestRate) / 100;
  }

  res.status(200).json({
    success: true,
    data: {
      ...loanWithoutInstallments,
      interestAmount,
    },
  });
});

// @desc    Delete loan
// @route   DELETE /api/loans/:id
// @access  Public
const deleteLoan = asyncHandler(async (req, res) => {
  const loan = await Loan.findById(req.params.id);

  if (!loan) {
    return res.status(404).json({
      success: false,
      error: "Loan not found",
    });
  }

  await Loan.findByIdAndDelete(req.params.id);

  Logger.info(`Deleted loan: ${loan._id}`);

  res.status(200).json({
    success: true,
    data: {},
  });
});

// @desc    Add payment to loan
// @route   POST /api/loans/:id/payments
// @access  Public
const addPayment = asyncHandler(async (req, res) => {
  const loan = await Loan.findById(req.params.id).populate(
    "customer",
    "fullName nic phone"
  );

  if (!loan) {
    return res.status(404).json({
      success: false,
      error: "Loan not found",
    });
  }

  const { amount, method = "cash", notes } = req.body;

  // Validate payment amount
  if (amount > loan.remainingAmount) {
    return res.status(400).json({
      success: false,
      error: "Payment amount cannot exceed remaining amount",
    });
  }

  // Add payment to history
  loan.paymentHistory.push({
    amount,
    method,
    notes,
  });

  // Update paid amount
  loan.paidAmount += amount;

  await loan.save();

  Logger.info(`Added payment of ${amount} to loan: ${loan._id}`);

  res.status(200).json({
    success: true,
    data: loan,
  });
});

// @desc    Get loan statistics
// @route   GET /api/loans/stats
// @access  Public
const getLoanStats = asyncHandler(async (req, res) => {
  const totalLoans = await Loan.countDocuments();
  const activeLoans = await Loan.countDocuments({ status: "active" });
  const completedLoans = await Loan.countDocuments({ status: "completed" });
  const overdueLoans = await Loan.countDocuments({ status: "overdue" });

  // Calculate total amounts
  const totalLoanAmount = await Loan.aggregate([
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ]);

  const totalOutstanding = await Loan.aggregate([
    { $match: { status: { $in: ["active", "overdue"] } } },
    { $group: { _id: null, total: { $sum: "$remainingAmount" } } },
  ]);

  const stats = {
    totalLoans,
    activeLoans,
    completedLoans,
    overdueLoans,
    totalLoanAmount: totalLoanAmount[0]?.total || 0,
    totalOutstanding: totalOutstanding[0]?.total || 0,
  };

  res.status(200).json({
    success: true,
    data: stats,
  });
});

// @desc    Get overdue loans
// @route   GET /api/loans/overdue
// @access  Public
const getOverdueLoans = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);

  const overdueLoans = await Loan.find({
    $or: [
      { status: "overdue" },
      {
        status: "active",
        dueDate: { $lt: new Date() },
      },
    ],
  })
    .populate("customer", "fullName nic phone")
    .sort("dueDate")
    .limit(limit)
    .skip(skip);

  const total = await Loan.countDocuments({
    $or: [
      { status: "overdue" },
      {
        status: "active",
        dueDate: { $lt: new Date() },
      },
    ],
  });

  const pagination = createPaginationResponse(total, page, limit);

  res.status(200).json({
    success: true,
    data: overdueLoans,
    pagination,
  });
});

// @desc    Add a new installment to a loan
// @route   POST /api/loans/:id/installments
// @access  Public
const addInstallment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { amountCollected, collectedDate, notes } = req.body;
  const loan = await Loan.findById(id);
  if (!loan) {
    return res.status(404).json({ success: false, error: "Loan not found" });
  }
  const newInstallment = {
    amountCollected,
    collectedDate,
    notes,
  };
  loan.installments.push(newInstallment);

  // Recalculate paidAmount as the sum of all installments
  loan.paidAmount = loan.installments.reduce(
    (sum, inst) => sum + (Number(inst.amountCollected) || 0),
    0
  );
  loan.remainingAmount = loan.totalAmount - loan.paidAmount;

  // Update status if needed
  if (loan.paidAmount >= loan.totalAmount) {
    loan.status = "completed";
  } else if (loan.dueDate < new Date() && loan.status === "active") {
    loan.status = "overdue";
  }

  await loan.save();
  // Return the updated loan (with all fields recalculated)
  const updatedLoan = await Loan.findById(id).populate("customer").lean();
  // Sort installments: last one first
  if (updatedLoan.installments && Array.isArray(updatedLoan.installments)) {
    updatedLoan.installments = updatedLoan.installments.sort(
      (a, b) => new Date(b.collectedDate) - new Date(a.collectedDate)
    );
  }
  res.status(201).json({ success: true, data: updatedLoan });
});

// @desc    Get single loan by loanId
// @route   GET /api/loans/by-id/:loanId
// @access  Public
const getLoanByLoanId = asyncHandler(async (req, res) => {
  const loan = await Loan.findOne({ loanId: req.params.loanId })
    .populate("customer")
    .lean();

  if (!loan) {
    return res.status(404).json({
      success: false,
      error: "Loan not found",
    });
  }

  // Calculate all next scheduled installment dates and installment amount
  let nextInstallmentDates = [];
  let completionPercentage = 0;
  let interestAmount = 0;
  // Calculate installmentAmount for all loans with duration and totalAmount
  let installmentAmount = null;
  if (loan.duration && loan.totalAmount) {
    installmentAmount =
      Math.round((loan.totalAmount / loan.duration) * 100) / 100;
  }

  // Calculate interest amount
  if (loan.amount && loan.interestRate) {
    interestAmount = (loan.amount * loan.interestRate) / 100;
  }
  if (
    Array.isArray(loan.installments) &&
    loan.installments.length > 0 &&
    loan.duration &&
    loan.paymentMethod
  ) {
    // Find the first installment date
    const sortedInstallments = loan.installments
      .filter((inst) => inst.collectedDate)
      .sort((a, b) => new Date(a.collectedDate) - new Date(b.collectedDate));
    if (sortedInstallments.length > 0) {
      const firstDate = new Date(sortedInstallments[0].collectedDate);
      let intervalDays = 1;
      if (loan.paymentMethod === "weekly") intervalDays = 7;
      if (loan.paymentMethod === "monthly") intervalDays = 30;
      // Generate all scheduled dates
      const allDates = [];
      for (let i = 0; i < loan.duration; i++) {
        const d = new Date(firstDate);
        d.setDate(d.getDate() + i * intervalDays);
        allDates.push(new Date(d));
      }
      // Only future dates (today or later)
      const now = new Date();
      nextInstallmentDates = allDates
        .filter((date) => date >= new Date(now.setHours(0, 0, 0, 0)))
        .map((date) => date.toISOString());
      // Calculate completion percentage
      const paidAmount = loan.paidAmount || 0;
      const totalAmount = loan.totalAmount || 1;
      completionPercentage = Math.round((paidAmount / totalAmount) * 100);
    }
  }

  Logger.info(`Retrieved loan by loanId: ${loan.loanId}`);

  res.status(200).json({
    success: true,
    data: {
      ...loan,
      nextInstallmentDates,
      completionPercentage,
      installmentAmount,
      interestAmount,
    },
  });
});

// @desc    Get loan payment schedule
// @route   GET /api/loans/:id/schedule
// @access  Public
const getLoanSchedule = asyncHandler(async (req, res) => {
  const loan = await Loan.findById(req.params.id);

  if (!loan) {
    return res.status(404).json({
      success: false,
      error: "Loan not found",
    });
  }

  const schedule = loan.installments.map((installment) => ({
    installmentNumber: installment.installmentNumber,
    amount: installment.installmentAmount,
    dueDate: installment.dueDate,
    status: installment.status,
    paidDate: installment.paidDate,
    paidAmount: installment.paidAmount,
  }));

  const progress = {
    completionPercentage: loan.completionPercentage,
    paidInstallments: loan.paidInstallmentsCount,
    remainingInstallments:
      loan.installments.length - loan.paidInstallmentsCount,
    nextDueDate: loan.nextDueInstallment?.dueDate || null,
  };

  Logger.info(`Retrieved payment schedule for loan: ${loan.loanId}`);

  res.status(200).json({
    success: true,
    data: {
      loanId: loan.loanId,
      loanDetails: {
        amount: loan.amount,
        totalAmount: loan.totalAmount,
        paymentMethod: loan.paymentMethod,
        duration: loan.duration,
        installmentAmount: loan.installmentAmount,
        issueDate: loan.issueDate,
        dueDate: loan.dueDate,
      },
      schedule,
      progress,
    },
  });
});

// @desc    Make payment on specific installment
// @route   POST /api/loans/:id/installments/:installmentNumber/payment
// @access  Public
const makeInstallmentPayment = asyncHandler(async (req, res) => {
  const { amount, method = "cash", notes = "" } = req.body;
  const { id, installmentNumber } = req.params;

  if (!amount || amount <= 0) {
    return res.status(400).json({
      success: false,
      error: "Payment amount must be greater than 0",
    });
  }

  const loan = await Loan.findById(id);

  if (!loan) {
    return res.status(404).json({
      success: false,
      error: "Loan not found",
    });
  }

  try {
    await loan.makePayment(parseInt(installmentNumber), amount, notes);

    // Get updated installment
    const updatedInstallment = loan.installments.find(
      (inst) => inst.installmentNumber === parseInt(installmentNumber)
    );

    // Create payment record
    const paymentRecord = loan.paymentHistory[loan.paymentHistory.length - 1];

    Logger.info(
      `Payment of ${amount} made on installment ${installmentNumber} for loan: ${loan.loanId}`
    );

    res.status(200).json({
      success: true,
      data: {
        installment: updatedInstallment,
        loan: {
          loanId: loan.loanId,
          totalAmount: loan.totalAmount,
          paidAmount: loan.paidAmount,
          remainingAmount: loan.remainingAmount,
          completionPercentage: loan.completionPercentage,
          status: loan.status,
        },
        paymentId: paymentRecord._id,
      },
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// @desc    Bulk payment on multiple installments
// @route   POST /api/loans/:id/installments/bulk-payment
// @access  Public
const bulkInstallmentPayment = asyncHandler(async (req, res) => {
  const {
    totalAmount,
    method = "cash",
    notes = "",
    startFromInstallment,
  } = req.body;
  const { id } = req.params;

  if (!totalAmount || totalAmount <= 0) {
    return res.status(400).json({
      success: false,
      error: "Total amount must be greater than 0",
    });
  }

  const loan = await Loan.findById(id);

  if (!loan) {
    return res.status(404).json({
      success: false,
      error: "Loan not found",
    });
  }

  let remainingAmount = totalAmount;
  const paymentsApplied = [];

  // Find starting installment
  let startInstallment = startFromInstallment || 1;
  if (!startFromInstallment) {
    const nextDue = loan.nextDueInstallment;
    if (nextDue) {
      startInstallment = nextDue.installmentNumber;
    }
  }

  // Apply payments to installments in order
  for (
    let i = startInstallment;
    i <= loan.installments.length && remainingAmount > 0;
    i++
  ) {
    const installment = loan.installments.find(
      (inst) => inst.installmentNumber === i
    );

    if (!installment || installment.status === "paid") {
      continue;
    }

    const amountDue = installment.installmentAmount - installment.paidAmount;
    const paymentAmount = Math.min(remainingAmount, amountDue);

    try {
      await loan.makePayment(i, paymentAmount, `${notes} (Bulk payment)`);

      paymentsApplied.push({
        installmentNumber: i,
        amountApplied: paymentAmount,
        status: paymentAmount >= amountDue ? "paid" : "partial",
      });

      remainingAmount -= paymentAmount;
    } catch (error) {
      break; // Stop if any payment fails
    }
  }

  Logger.info(
    `Bulk payment of ${totalAmount - remainingAmount} applied to ${
      paymentsApplied.length
    } installments for loan: ${loan.loanId}`
  );

  res.status(200).json({
    success: true,
    data: {
      paymentsApplied,
      totalApplied: totalAmount - remainingAmount,
      remainingAmount,
      loan: {
        loanId: loan.loanId,
        paidAmount: loan.paidAmount,
        remainingAmount: loan.remainingAmount,
        completionPercentage: loan.completionPercentage,
      },
    },
  });
});

// @desc    Get overdue installments across all loans
// @route   GET /api/loans/installments/overdue
// @access  Public
const getOverdueInstallments = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, customer, daysOverdue } = req.query;
  const skip = (page - 1) * limit;

  // Build match query
  const matchQuery = {
    "installments.status": "overdue",
  };

  if (customer) {
    matchQuery.customer = mongoose.Types.ObjectId(customer);
  }

  const aggregateQuery = [
    { $match: matchQuery },
    { $unwind: "$installments" },
    { $match: { "installments.status": "overdue" } },
    {
      $lookup: {
        from: "customers",
        localField: "customer",
        foreignField: "_id",
        as: "customerInfo",
      },
    },
    { $unwind: "$customerInfo" },
    {
      $addFields: {
        "installments.daysOverdue": {
          $ceil: {
            $divide: [
              { $subtract: [new Date(), "$installments.dueDate"] },
              1000 * 60 * 60 * 24,
            ],
          },
        },
      },
    },
  ];

  // Filter by minimum days overdue if provided
  if (daysOverdue) {
    aggregateQuery.push({
      $match: { "installments.daysOverdue": { $gte: parseInt(daysOverdue) } },
    });
  }

  aggregateQuery.push(
    { $sort: { "installments.dueDate": 1 } },
    { $skip: skip },
    { $limit: parseInt(limit) },
    {
      $project: {
        loanId: 1,
        customerId: "$customerInfo.customerId",
        customerName: "$customerInfo.fullName",
        installmentNumber: "$installments.installmentNumber",
        installmentAmount: "$installments.installmentAmount",
        dueDate: "$installments.dueDate",
        daysOverdue: "$installments.daysOverdue",
        paidAmount: "$installments.paidAmount",
        status: "$installments.status",
        loan: {
          _id: "$_id",
          status: "$status",
        },
      },
    }
  );

  const overdueInstallments = await Loan.aggregate(aggregateQuery);

  // Get summary statistics
  const summaryQuery = [
    { $match: matchQuery },
    { $unwind: "$installments" },
    { $match: { "installments.status": "overdue" } },
    {
      $addFields: {
        "installments.daysOverdue": {
          $ceil: {
            $divide: [
              { $subtract: [new Date(), "$installments.dueDate"] },
              1000 * 60 * 60 * 24,
            ],
          },
        },
      },
    },
    {
      $group: {
        _id: null,
        totalOverdueAmount: {
          $sum: {
            $subtract: [
              "$installments.installmentAmount",
              "$installments.paidAmount",
            ],
          },
        },
        totalOverdueCount: { $sum: 1 },
        affectedLoansCount: { $addToSet: "$_id" },
        averageDaysOverdue: { $avg: "$installments.daysOverdue" },
      },
    },
    {
      $project: {
        totalOverdueAmount: 1,
        totalOverdueCount: 1,
        affectedLoansCount: { $size: "$affectedLoansCount" },
        averageDaysOverdue: { $round: ["$averageDaysOverdue", 1] },
      },
    },
  ];

  const summary = await Loan.aggregate(summaryQuery);

  Logger.info(`Retrieved ${overdueInstallments.length} overdue installments`);

  res.status(200).json({
    success: true,
    data: overdueInstallments,
    summary: summary[0] || {
      totalOverdueAmount: 0,
      totalOverdueCount: 0,
      affectedLoansCount: 0,
      averageDaysOverdue: 0,
    },
    pagination: {
      currentPage: parseInt(page),
      totalPages: Math.ceil((summary[0]?.totalOverdueCount || 0) / limit),
      totalCount: summary[0]?.totalOverdueCount || 0,
      hasNext: skip + parseInt(limit) < (summary[0]?.totalOverdueCount || 0),
      hasPrev: page > 1,
    },
  });
});

// @desc    Get upcoming installments
// @route   GET /api/loans/installments/upcoming
// @access  Public
const getUpcomingInstallments = asyncHandler(async (req, res) => {
  const { days = 7, customer, page = 1, limit = 20 } = req.query;
  const skip = (page - 1) * limit;

  const endDate = new Date();
  endDate.setDate(endDate.getDate() + parseInt(days));

  // Build match query
  const matchQuery = {
    "installments.status": { $in: ["pending", "partial"] },
    "installments.dueDate": { $lte: endDate },
  };

  if (customer) {
    matchQuery.customer = mongoose.Types.ObjectId(customer);
  }

  const aggregateQuery = [
    { $match: matchQuery },
    { $unwind: "$installments" },
    {
      $match: {
        "installments.status": { $in: ["pending", "partial"] },
        "installments.dueDate": { $lte: endDate },
      },
    },
    {
      $lookup: {
        from: "customers",
        localField: "customer",
        foreignField: "_id",
        as: "customerInfo",
      },
    },
    { $unwind: "$customerInfo" },
    {
      $addFields: {
        "installments.daysUntilDue": {
          $ceil: {
            $divide: [
              { $subtract: ["$installments.dueDate", new Date()] },
              1000 * 60 * 60 * 24,
            ],
          },
        },
      },
    },
    { $sort: { "installments.dueDate": 1 } },
    { $skip: skip },
    { $limit: parseInt(limit) },
    {
      $project: {
        loanId: 1,
        customerId: "$customerInfo.customerId",
        customerName: "$customerInfo.fullName",
        customerPhone: "$customerInfo.phone",
        installmentNumber: "$installments.installmentNumber",
        installmentAmount: "$installments.installmentAmount",
        dueDate: "$installments.dueDate",
        daysUntilDue: "$installments.daysUntilDue",
        status: "$installments.status",
        loan: {
          _id: "$_id",
          status: "$status",
        },
      },
    },
  ];

  const upcomingInstallments = await Loan.aggregate(aggregateQuery);

  // Get summary statistics
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const weekEnd = new Date(today);
  weekEnd.setDate(weekEnd.getDate() + 7);

  const summaryQuery = [
    { $match: matchQuery },
    { $unwind: "$installments" },
    {
      $match: {
        "installments.status": { $in: ["pending", "partial"] },
        "installments.dueDate": { $lte: endDate },
      },
    },
    {
      $group: {
        _id: null,
        totalUpcomingAmount: {
          $sum: {
            $subtract: [
              "$installments.installmentAmount",
              "$installments.paidAmount",
            ],
          },
        },
        totalUpcomingCount: { $sum: 1 },
        dueTodayCount: {
          $sum: {
            $cond: [{ $lte: ["$installments.dueDate", today] }, 1, 0],
          },
        },
        dueTomorrowCount: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $gt: ["$installments.dueDate", today] },
                  { $lte: ["$installments.dueDate", tomorrow] },
                ],
              },
              1,
              0,
            ],
          },
        },
        dueThisWeekCount: {
          $sum: {
            $cond: [{ $lte: ["$installments.dueDate", weekEnd] }, 1, 0],
          },
        },
      },
    },
  ];

  const summary = await Loan.aggregate(summaryQuery);

  Logger.info(`Retrieved ${upcomingInstallments.length} upcoming installments`);

  res.status(200).json({
    success: true,
    data: upcomingInstallments,
    summary: summary[0] || {
      totalUpcomingAmount: 0,
      totalUpcomingCount: 0,
      dueTodayCount: 0,
      dueTomorrowCount: 0,
      dueThisWeekCount: 0,
    },
  });
});

// @desc    Update installment
// @route   PUT /api/loans/:id/installments/:installmentNumber
// @access  Public
const updateInstallment = asyncHandler(async (req, res) => {
  const { installmentAmount, dueDate, notes, paidAmount, paidDate } = req.body;
  const { id, installmentNumber } = req.params;

  const loan = await Loan.findById(id);

  if (!loan) {
    return res.status(404).json({
      success: false,
      error: "Loan not found",
    });
  }

  // Allow lookup by installment _id (ObjectId)
  const installment = loan.installments.find(
    (inst) => inst._id && inst._id.toString() === installmentNumber
  );

  if (!installment) {
    return res.status(404).json({
      success: false,
      error: "Installment not found",
    });
  }

  // Update fields if provided
  if (installmentAmount !== undefined) {
    installment.installmentAmount = installmentAmount;
  }
  if (dueDate !== undefined) {
    installment.dueDate = new Date(dueDate);
  }
  if (notes !== undefined) {
    installment.notes = notes;
  }
  if (paidAmount !== undefined) {
    installment.paidAmount = paidAmount;
  }
  if (paidDate !== undefined) {
    installment.paidDate = new Date(paidDate);
  }

  await loan.save();

  Logger.info(
    `Updated installment ${installmentNumber} for loan: ${loan.loanId}`
  );

  res.status(200).json({
    success: true,
    data: installment,
  });
});

// @desc    Get installment statistics
// @route   GET /api/loans/installments/stats
// @access  Public
const getInstallmentStats = asyncHandler(async (req, res) => {
  const { period = "all", customer } = req.query;

  // Build base match query
  let baseMatch = {};
  if (customer) {
    baseMatch.customer = mongoose.Types.ObjectId(customer);
  }

  // Date filters based on period
  let dateFilter = {};
  const now = new Date();

  switch (period) {
    case "today":
      dateFilter = {
        $gte: new Date(now.setHours(0, 0, 0, 0)),
        $lt: new Date(now.setHours(23, 59, 59, 999)),
      };
      break;
    case "week":
      const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
      weekStart.setHours(0, 0, 0, 0);
      dateFilter = { $gte: weekStart };
      break;
    case "month":
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      dateFilter = { $gte: monthStart };
      break;
    case "year":
      const yearStart = new Date(now.getFullYear(), 0, 1);
      dateFilter = { $gte: yearStart };
      break;
  }

  // Overall statistics
  const overallStats = await Loan.aggregate([
    { $match: baseMatch },
    { $unwind: "$installments" },
    {
      $group: {
        _id: null,
        totalInstallments: { $sum: 1 },
        paidInstallments: {
          $sum: { $cond: [{ $eq: ["$installments.status", "paid"] }, 1, 0] },
        },
        overdueInstallments: {
          $sum: { $cond: [{ $eq: ["$installments.status", "overdue"] }, 1, 0] },
        },
        partialInstallments: {
          $sum: { $cond: [{ $eq: ["$installments.status", "partial"] }, 1, 0] },
        },
        pendingInstallments: {
          $sum: { $cond: [{ $eq: ["$installments.status", "pending"] }, 1, 0] },
        },
        totalCollected: { $sum: "$installments.paidAmount" },
        totalPending: {
          $sum: {
            $subtract: [
              "$installments.installmentAmount",
              "$installments.paidAmount",
            ],
          },
        },
      },
    },
    {
      $addFields: {
        collectionRate: {
          $round: [
            {
              $multiply: [
                { $divide: ["$paidInstallments", "$totalInstallments"] },
                100,
              ],
            },
            1,
          ],
        },
      },
    },
  ]);

  // Today's statistics
  const todayStats = await Loan.aggregate([
    { $match: baseMatch },
    { $unwind: "$installments" },
    {
      $match: {
        $or: [
          { "installments.dueDate": dateFilter },
          { "installments.paidDate": dateFilter },
        ],
      },
    },
    {
      $group: {
        _id: null,
        dueToday: {
          $sum: {
            $cond: [{ $lte: ["$installments.dueDate", new Date()] }, 1, 0],
          },
        },
        collectedToday: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $ne: ["$installments.paidDate", null] },
                  {
                    $gte: [
                      "$installments.paidDate",
                      new Date(now.setHours(0, 0, 0, 0)),
                    ],
                  },
                ],
              },
              1,
              0,
            ],
          },
        },
        amountCollectedToday: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $ne: ["$installments.paidDate", null] },
                  {
                    $gte: [
                      "$installments.paidDate",
                      new Date(now.setHours(0, 0, 0, 0)),
                    ],
                  },
                ],
              },
              "$installments.paidAmount",
              0,
            ],
          },
        },
        amountPendingToday: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $lte: ["$installments.dueDate", new Date()] },
                  {
                    $in: [
                      "$installments.status",
                      ["pending", "partial", "overdue"],
                    ],
                  },
                ],
              },
              {
                $subtract: [
                  "$installments.installmentAmount",
                  "$installments.paidAmount",
                ],
              },
              0,
            ],
          },
        },
      },
    },
  ]);

  // Payment method statistics
  const paymentMethodStats = await Loan.aggregate([
    { $match: baseMatch },
    { $unwind: "$installments" },
    {
      $group: {
        _id: "$paymentMethod",
        totalInstallments: { $sum: 1 },
        paidInstallments: {
          $sum: { $cond: [{ $eq: ["$installments.status", "paid"] }, 1, 0] },
        },
      },
    },
    {
      $addFields: {
        collectionRate: {
          $round: [
            {
              $multiply: [
                { $divide: ["$paidInstallments", "$totalInstallments"] },
                100,
              ],
            },
            1,
          ],
        },
      },
    },
  ]);

  // Overdue analysis
  const overdueAnalysis = await Loan.aggregate([
    { $match: baseMatch },
    { $unwind: "$installments" },
    { $match: { "installments.status": "overdue" } },
    {
      $addFields: {
        daysOverdue: {
          $ceil: {
            $divide: [
              { $subtract: [new Date(), "$installments.dueDate"] },
              1000 * 60 * 60 * 24,
            ],
          },
        },
      },
    },
    {
      $group: {
        _id: null,
        averageDaysOverdue: { $avg: "$daysOverdue" },
        totalOverdueAmount: {
          $sum: {
            $subtract: [
              "$installments.installmentAmount",
              "$installments.paidAmount",
            ],
          },
        },
        oldestOverdueDays: { $max: "$daysOverdue" },
      },
    },
    {
      $project: {
        averageDaysOverdue: { $round: ["$averageDaysOverdue", 1] },
        totalOverdueAmount: 1,
        oldestOverdueDays: 1,
      },
    },
  ]);

  const response = {
    overall: overallStats[0] || {},
    today: todayStats[0] || {},
    thisWeek: {},
    byPaymentMethod: {},
    overdueAnalysis: overdueAnalysis[0] || {},
  };

  // Format payment method stats
  paymentMethodStats.forEach((stat) => {
    response.byPaymentMethod[stat._id] = {
      totalInstallments: stat.totalInstallments,
      collectionRate: stat.collectionRate,
    };
  });

  Logger.info("Retrieved installment statistics");

  res.status(200).json({
    success: true,
    data: response,
  });
});

module.exports = {
  getLoans,
  getLoan,
  createLoan,
  updateLoan,
  deleteLoan,
  addPayment,
  getLoanStats,
  getOverdueLoans,
  getInstallments,
  updateInstallment,
  addInstallment,
  getLoanByLoanId,
  getLoanSchedule,
  makeInstallmentPayment,
  bulkInstallmentPayment,
  getOverdueInstallments,
  getUpcomingInstallments,
  getInstallmentStats,
};
