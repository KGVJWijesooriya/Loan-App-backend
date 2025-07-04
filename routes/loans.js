const express = require("express");
const {
  getLoans,
  getLoan,
  getLoanByLoanId,
  createLoan,
  updateLoan,
  deleteLoan,
  addPayment,
  getLoanStats,
  getOverdueLoans,
  getInstallments,
  updateInstallment,
  addInstallment,
  getLoanSchedule,
  makeInstallmentPayment,
  bulkInstallmentPayment,
  getOverdueInstallments,
  getUpcomingInstallments,
  getInstallmentStats,
} = require("../controllers/loanController");
const {
  validateSchema,
  createLoanSchema,
  updateLoanSchema,
  addPaymentSchema,
  makeInstallmentPaymentSchema,
  updateInstallmentSchema,
  bulkPaymentSchema,
} = require("../middleware/validation");

const router = express.Router();

// Installment statistics and cross-loan routes
router.get("/installments/overdue", getOverdueInstallments);
router.get("/installments/upcoming", getUpcomingInstallments);
router.get("/installments/stats", getInstallmentStats);

// Installment routes for specific loans
router.get("/:id/installments", getInstallments);
router.put(
  "/:id/installments/:installmentNumber",
  validateSchema(updateInstallmentSchema),
  updateInstallment
);
router.post("/:id/installments", addInstallment);
router.post(
  "/:id/installments/:installmentNumber/payment",
  validateSchema(makeInstallmentPaymentSchema),
  makeInstallmentPayment
);
router.post(
  "/:id/installments/bulk-payment",
  validateSchema(bulkPaymentSchema),
  bulkInstallmentPayment
);

// Loan schedule
router.get("/:id/schedule", getLoanSchedule);

// Loan statistics and special routes
router.get("/stats", getLoanStats);
router.get("/overdue", getOverdueLoans);
router.get("/by-id/:loanId", getLoanByLoanId);

// Payment routes
router.post("/:id/payments", validateSchema(addPaymentSchema), addPayment);

// Loan CRUD operations
router
  .route("/")
  .get(getLoans)
  .post(validateSchema(createLoanSchema), createLoan);

router
  .route("/:id")
  .get(getLoan)
  .put(validateSchema(updateLoanSchema), updateLoan)
  .delete(deleteLoan);

module.exports = router;
