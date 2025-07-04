const express = require("express");
const {
  getCustomers,
  getCustomer,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getCustomerStats,
  getCustomerByCustomerId,
} = require("../controllers/customerController");
const {
  validateSchema,
  createCustomerSchema,
  updateCustomerSchema,
} = require("../middleware/validation");

const router = express.Router();

// Get customer by customerId
router.get("/by-customer-id/:customerId", getCustomerByCustomerId);

// Customer statistics
router.get("/stats", getCustomerStats);

// Customer CRUD operations
router
  .route("/")
  .get(getCustomers)
  .post(validateSchema(createCustomerSchema), createCustomer);

router
  .route(":/id")
  .get(getCustomer)
  .put(validateSchema(updateCustomerSchema), updateCustomer)
  .delete(deleteCustomer);

module.exports = router;
