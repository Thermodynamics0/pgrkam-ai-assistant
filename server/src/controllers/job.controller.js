
const prisma = require("../services/prisma.service");

// Get jobs with optional search and filters
const getJobs = async (req, res) => {
  try {
    const { search, location, employmentType } = req.query;

    const filters = {};

    // Search by job title or company
    if (search) {
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
        }
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
      }
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
    const {
      title,
      company,
      location,
      description,
      skills,
      employmentType
    } = req.body;

    // Check required fields
    if (!title || !company || !location || !description) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required fields"
      });
    }

    // Save job in database
    const job = await prisma.job.create({
      data: {
        title,
        company,
        location,
        description,
        skills: skills || [],
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


module.exports = { getJobs, createJob };
