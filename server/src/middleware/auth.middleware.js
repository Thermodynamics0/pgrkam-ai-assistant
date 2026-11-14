
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

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "pgrkam_secret_key"
    );
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
