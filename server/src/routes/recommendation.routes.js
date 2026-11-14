
const express = require("express");
const router = express.Router();

const {
  getRecommendations,
  getRecommendationHistory,
} = require("../controllers/recommendation.controller");
const authMiddleware = require("../middleware/auth.middleware");

// All recommendation routes require authentication
router.get("/", authMiddleware, getRecommendations);
router.get("/history", authMiddleware, getRecommendationHistory);

module.exports = router;
