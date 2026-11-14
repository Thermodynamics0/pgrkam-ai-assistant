
const express = require("express");
const router = express.Router();

const { getProfile, updateProfile } = require("../controllers/profile.controller");
const authMiddleware = require("../middleware/auth.middleware");

// All profile routes require authentication
router.get("/", authMiddleware, getProfile);
router.put("/", authMiddleware, updateProfile);

module.exports = router;
