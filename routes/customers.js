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
const { validateJWT } = require("../middleware/auth");

const router = express.Router();

// Get customer by customerId
router.get("/by-customer-id/:customerId", validateJWT, getCustomerByCustomerId);

// Customer statistics
router.get("/stats", validateJWT, getCustomerStats);

// Customer CRUD operations
router
  .route("/")
  .get(validateJWT, getCustomers)
  .post(validateJWT, validateSchema(createCustomerSchema), createCustomer);

router
  .route("/:id")
  .get(validateJWT, getCustomer)
  .put(validateJWT, validateSchema(updateCustomerSchema), updateCustomer)
  .delete(validateJWT, deleteCustomer);

module.exports = router;
