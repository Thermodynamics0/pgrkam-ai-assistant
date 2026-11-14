
const express = require("express");
const { chat } = require("../controllers/chat.controller");
const authMiddleware = require("../middleware/auth.middleware");

function createChatRouter(chatHandler = chat) {
  const router = express.Router();
  // POST /api/chat — Auth is optional; verified candidate tokens personalize context.
  const optionalAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      return authMiddleware(req, res, next);
    }
    next();
  };

  router.post("/", optionalAuth, chatHandler);
  return router;
}

module.exports = createChatRouter();
module.exports.createChatRouter = createChatRouter;
