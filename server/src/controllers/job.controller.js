
const prisma = require("../services/prisma.service");

// Get jobs with optional search and filters
const getJobs = async (req, res) => {
  try {
    const { search, location, employmentType } = req.query;
    if ([search, location, employmentType].some((value) => value !== undefined && (typeof value !== "string" || value.length > 160))) {
      return res.status(400).json({ success: false, code: "VALIDATION_ERROR", message: "Search filters must be 160 characters or fewer." });
    }

    const filters = {};

    // Search by job title or company
    if (search?.trim()) {
      const searchTerms = [...new Set(search.trim().split(/\s+/).filter((term) => term.length > 1))].slice(0, 10);
      const skillTerms = [...new Set(searchTerms.flatMap((term) => [term, term.toLowerCase(), term.toUpperCase(), term[0].toUpperCase() + term.slice(1).toLowerCase()]))];
      filters.OR = [
        {
          title: {
            contains: search,
            mode: "insensitive"
          }
        },
        {
          company: {
            contains: search,
            mode: "insensitive"
          }
        },
        { description: { contains: search.trim(), mode: "insensitive" } },
        { skills: { hasSome: skillTerms } },
      ];
    }

    // Filter by location
    if (location) {
      filters.location = {
        contains: location,
        mode: "insensitive"
      };
    }

    // Filter by employment type
    if (employmentType) {
      filters.employmentType = employmentType;
    }

    const jobs = await prisma.job.findMany({
      where: filters,
      orderBy: {
        createdAt: "desc"
      },
      take: 100,
    });

    res.status(200).json({
      success: true,
      count: jobs.length,
      data: jobs
    });

  } catch (error) {
    console.error("Job fetching error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch jobs"
    });
  }
};


const createJob = async (req, res) => {
  try {
    if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) {
      return res.status(400).json({ success: false, code: "VALIDATION_ERROR", message: "A job object is required." });
    }
    const {
      title,
      company,
      location,
      description,
      skills,
      employmentType
    } = req.body;

    // Check required fields
    if ([title, company, location, description].some((value) => typeof value !== "string" || !value.trim()) ||
        title.length > 160 || company.length > 160 || location.length > 160 || description.length > 10000 ||
        (skills !== undefined && (!Array.isArray(skills) || skills.length > 50 || skills.some((skill) => typeof skill !== "string" || skill.length > 80))) ||
        (employmentType != null && (typeof employmentType !== "string" || employmentType.length > 80))) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required fields"
      });
    }

    // Save job in database
    const job = await prisma.job.create({
      data: {
        title: title.trim(),
        company: company.trim(),
        location: location.trim(),
        description: description.trim(),
        skills: (skills || []).map((skill) => skill.trim()).filter(Boolean),
        employmentType
      }
    });

    res.status(201).json({
      success: true,
      message: "Job created successfully",
      data: job
    });

  } catch (error) {
    console.error("Create job error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to create job"
    });
  }
};


// GET /api/jobs/:id  — get single job by ID
const getJobById = async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({ success: false, message: "Invalid job ID" });
    }

    const job = await prisma.job.findUnique({ where: { id } });

    if (!job) {
      return res.status(404).json({ success: false, message: "Job not found" });
    }

    return res.status(200).json({ success: true, data: job });
  } catch (error) {
    console.error("Get job by ID error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch job" });
  }
};

module.exports = { getJobs, getJobById, createJob };
