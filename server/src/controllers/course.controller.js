
const prisma = require("../services/prisma.service");

// GET /api/courses  — list all courses with optional skill filter
const getCourses = async (req, res) => {
  try {
    const { skill, search } = req.query;
    if ([skill, search].some((value) => value !== undefined && (typeof value !== "string" || value.length > 160))) {
      return res.status(400).json({ success: false, code: "VALIDATION_ERROR", message: "Course search filters must be 160 characters or fewer." });
    }

    let where = {};

    if (skill) {
      where.skills = { has: skill };
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { provider: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    const courses = await prisma.course.findMany({
      where,
      orderBy: { title: "asc" },
      take: 100,
    });

    return res.status(200).json({
      success: true,
      count: courses.length,
      data: courses,
    });
  } catch (error) {
    console.error("Get courses error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch courses" });
  }
};

// GET /api/courses/:id  — get single course
const getCourseById = async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    const course = await prisma.course.findUnique({ where: { id } });

    if (!course) {
      return res.status(404).json({ success: false, message: "Course not found" });
    }

    return res.status(200).json({ success: true, data: course });
  } catch (error) {
    console.error("Get course error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch course" });
  }
};

// POST /api/courses  — create a course (admin use)
const createCourse = async (req, res) => {
  try {
    if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) {
      return res.status(400).json({ success: false, code: "VALIDATION_ERROR", message: "A course object is required." });
    }
    const { title, provider, description, url, skills } = req.body;

    if (typeof title !== "string" || !title.trim() || title.length > 200 || typeof provider !== "string" || !provider.trim() || provider.length > 160 ||
        (description != null && (typeof description !== "string" || description.length > 10000)) ||
        (url != null && (typeof url !== "string" || (url && !/^https?:\/\//i.test(url)))) ||
        (skills !== undefined && (!Array.isArray(skills) || skills.length > 50 || skills.some((skill) => typeof skill !== "string" || skill.length > 80)))) {
      return res.status(400).json({
        success: false,
        message: "Please provide title and provider",
      });
    }

    const course = await prisma.course.create({
      data: {
        title: title.trim(),
        provider: provider.trim(),
        description,
        url,
        skills: (skills || []).map((skill) => skill.trim()).filter(Boolean),
      },
    });

    return res.status(201).json({
      success: true,
      message: "Course created successfully",
      data: course,
    });
  } catch (error) {
    console.error("Create course error:", error);
    return res.status(500).json({ success: false, message: "Failed to create course" });
  }
};

module.exports = { getCourses, getCourseById, createCourse };
