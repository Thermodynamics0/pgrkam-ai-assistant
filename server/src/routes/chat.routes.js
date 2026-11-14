
const express = require("express");
const { chat } = require("../controllers/chat.controller");
const authMiddleware = require("../middleware/auth.middleware");
const { createChatRateLimiter } = require("../middleware/chat-rate-limit.middleware");

function createChatRouter(chatHandler = chat, rateLimiter = createChatRateLimiter()) {
  const router = express.Router();
  // POST /api/chat — Auth is optional; verified candidate tokens personalize context.
  const optionalAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      return authMiddleware(req, res, next);
    }
    next();
  };

  router.post("/", rateLimiter, optionalAuth, chatHandler);
  return router;
}

module.exports = createChatRouter();
module.exports.createChatRouter = createChatRouter;
