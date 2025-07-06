const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const { validateJWT } = require("../middleware/auth");
const multer = require("multer");
const path = require("path");

// Multer setup for profile image upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/profileImages/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

// Get available languages and currencies
router.get("/preferences/options", validateJWT, userController.getPreferences);

// Update user language and currency preferences
router.put("/:id/preferences", validateJWT, userController.updatePreferences);

// View user profile by userId
router.get("/:id", validateJWT, userController.viewUser);

// Edit user profile by userId (with image upload)
router.put(
  "/:id",
  validateJWT,
  upload.single("profileImage"),
  userController.editUser
);

module.exports = router;
