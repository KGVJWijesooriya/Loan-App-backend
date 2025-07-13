const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { validateJWT } = require("../middleware/auth");

// Register route
router.post("/register", authController.register);

// Login route
router.post("/login", authController.login);

// Logout route
router.post("/logout", validateJWT, authController.logout);

module.exports = router;
