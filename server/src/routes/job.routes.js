
const express = require("express");
const router = express.Router();

const { getJobs, getJobById, createJob } = require("../controllers/job.controller");

// GET  /api/jobs        — list all jobs (with optional filters)
router.get("/", getJobs);

// GET  /api/jobs/:id    — single job  ← agreed contract
router.get("/:id", getJobById);

// POST /api/jobs        — create job
router.post("/", createJob);

module.exports = router;
