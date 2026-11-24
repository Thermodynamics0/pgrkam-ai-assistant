
const express = require("express");
const router = express.Router();

const { getJobs, getJobById, createJob } = require("../controllers/job.controller");
const { getLiveJobs } = require("../controllers/live-job.controller");
const authMiddleware = require("../middleware/auth.middleware");
const requireRole = authMiddleware.requireRole;

// GET  /api/jobs/live   — live jobs from Jooble (must be before /:id)
router.get("/live", getLiveJobs);

// GET  /api/jobs        — list all jobs (with optional filters)
router.get("/", getJobs);

// GET  /api/jobs/:id    — single job  ← agreed contract
router.get("/:id", getJobById);

// POST /api/jobs        — create job
router.post("/", authMiddleware, requireRole("ADMIN", "EMPLOYER"), createJob);

module.exports = router;
