
const express = require("express");
const router = express.Router();

const { getJobs, createJob } = require("../controllers/job.controller");

router.get("/", getJobs);
router.post("/", createJob);

module.exports = router;
