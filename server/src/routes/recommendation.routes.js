
const express = require("express");
const router = express.Router();

const {
  getRecommendations,
  getRecommendationHistory,
} = require("../controllers/recommendation.controller");
const authMiddleware = require("../middleware/auth.middleware");

// POST /api/recommendations   ← agreed contract (Member 2 + 3)
// Body: { userId: number }
router.post("/", authMiddleware, getRecommendations);

// GET /api/recommendations/history
router.get("/history", authMiddleware, getRecommendationHistory);

module.exports = router;
