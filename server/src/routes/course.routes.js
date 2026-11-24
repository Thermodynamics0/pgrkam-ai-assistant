
const express = require("express");
const router = express.Router();

const { getCourses, getCourseById, createCourse } = require("../controllers/course.controller");
const authMiddleware = require("../middleware/auth.middleware");
const requireRole = authMiddleware.requireRole;

// GET /api/courses         — public, list all
router.get("/", getCourses);

// GET /api/courses/:id     — public, single course
router.get("/:id", getCourseById);

// POST /api/courses        — protected, create course
router.post("/", authMiddleware, requireRole("ADMIN"), createCourse);

module.exports = router;
