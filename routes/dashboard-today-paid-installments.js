const express = require("express");
const router = express.Router();
const {
  listTodayPaidInstallments,
} = require("../controllers/dashboard/listTodayPaidInstallments");

// GET /api/dashboard/today-paid-installments
router.get("/today-paid-installments", listTodayPaidInstallments);

module.exports = router;
