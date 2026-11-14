
const express = require("express");
const router = express.Router();

const { chat } = require("../controllers/chat.controller");
const authMiddleware = require("../middleware/auth.middleware");

// POST /api/chat
// Auth is optional — authenticated users get personalized context
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authMiddleware(req, res, next);
  }
  next();
};

router.post("/", optionalAuth, chat);

module.exports = router;
