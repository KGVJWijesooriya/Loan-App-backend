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
const { validateJWT } = require("../middleware/auth");

const router = express.Router();

// Installment statistics and cross-loan routes
router.get("/installments/overdue", validateJWT, getOverdueInstallments);
router.get("/installments/upcoming", validateJWT, getUpcomingInstallments);
router.get("/installments/stats", validateJWT, getInstallmentStats);

// Installment routes for specific loans
router.get("/:id/installments", validateJWT, getInstallments);
router.put(
  "/:id/installments/:installmentNumber",
  validateJWT,
  validateSchema(updateInstallmentSchema),
  updateInstallment
);
router.post("/:id/installments", validateJWT, addInstallment);
router.post(
  "/:id/installments/:installmentNumber/payment",
  validateJWT,
  validateSchema(makeInstallmentPaymentSchema),
  makeInstallmentPayment
);
router.post(
  "/:id/installments/bulk-payment",
  validateJWT,
  validateSchema(bulkPaymentSchema),
  bulkInstallmentPayment
);

// Loan schedule
router.get("/:id/schedule", validateJWT, getLoanSchedule);

// Loan statistics and special routes
router.get("/stats", validateJWT, getLoanStats);
router.get("/overdue", validateJWT, getOverdueLoans);
router.get("/by-id/:loanId", validateJWT, getLoanByLoanId);

// Payment routes
router.post(
  "/:id/payments",
  validateJWT,
  validateSchema(addPaymentSchema),
  addPayment
);

// Loan CRUD operations
router
  .route("/")
  .get(validateJWT, getLoans)
  .post(validateJWT, validateSchema(createLoanSchema), createLoan);

router
  .route("/:id")
  .get(validateJWT, getLoan)
  .put(validateJWT, validateSchema(updateLoanSchema), updateLoan)
  .delete(validateJWT, deleteLoan);

module.exports = router;
