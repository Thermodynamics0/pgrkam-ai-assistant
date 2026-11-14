
const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      code: "AUTHENTICATION_REQUIRED",
      message: "Access denied. No token provided.",
    });
  }

  const token = authHeader.split(" ")[1];

  if (!process.env.JWT_SECRET?.trim()) {
    return res.status(503).json({
      success: false,
      code: "AUTH_CONFIGURATION_ERROR",
      message: "Authentication is temporarily unavailable.",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { userId, role }
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      code: "INVALID_TOKEN",
      message: "Invalid or expired token",
    });
  }
};

module.exports = authMiddleware;
