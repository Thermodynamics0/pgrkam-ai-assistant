
const express = require("express");
const router = express.Router();

const { getProfile, updateProfile } = require("../controllers/profile.controller");
const authMiddleware = require("../middleware/auth.middleware");

// GET /api/profile/:id   — get profile by user ID (auth required)
router.get("/me", authMiddleware, (req, res, next) => {
  req.params.id = String(req.user.userId);
  return getProfile(req, res, next);
});
router.put("/me", authMiddleware, (req, res, next) => {
  req.params.id = String(req.user.userId);
  return updateProfile(req, res, next);
});
router.get("/:id", authMiddleware, getProfile);

// PUT /api/profile/:id   — update profile by user ID (auth required, own only)
router.put("/:id", authMiddleware, updateProfile);

module.exports = router;
