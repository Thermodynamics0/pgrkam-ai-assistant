
const prisma = require("../services/prisma.service");

/**
 * GET /api/profile/:id
 * Returns the user and their candidate profile.
 * Candidate education, location and skills are private to the authenticated user.
 */
const getProfile = async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({ success: false, message: "Invalid user ID" });
    }

    if (Number(req.user?.userId) !== id) {
      return res.status(403).json({ success: false, code: "FORBIDDEN", message: "You can only view your own profile." });
    }

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        role: true,
        createdAt: true,
        profile: true,
      },
    });

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    return res.status(200).json({ success: true, data: user });
  } catch (error) {
    console.error("Get profile error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch profile" });
  }
};

/**
 * PUT /api/profile/:id
 * Create or update candidate profile.
 * Only the authenticated user can update their own profile.
 */
const updateProfile = async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({ success: false, message: "Invalid user ID" });
    }

    // Authorization: can only update own profile
    if (req.user.userId !== id) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: you can only update your own profile",
      });
    }

    const { location, education, skills, experienceYears } = req.body || {};
    if ((location != null && (typeof location !== "string" || location.length > 160)) ||
        (education != null && (typeof education !== "string" || education.length > 300)) ||
        (skills != null && (!Array.isArray(skills) || skills.length > 50 || skills.some((s) => typeof s !== "string" || s.length > 80))) ||
        (experienceYears != null && (!Number.isInteger(Number(experienceYears)) || Number(experienceYears) < 0 || Number(experienceYears) > 60))) {
      return res.status(400).json({ success: false, code: "VALIDATION_ERROR", message: "Please check your profile details and try again." });
    }

    // Upsert: create if doesn't exist, update if it does
    const profile = await prisma.candidateProfile.upsert({
      where: { userId: id },
      update: {
        location,
        education,
        skills: (skills || []).map((skill) => skill.trim()).filter(Boolean),
        ...(experienceYears != null && {
          experienceYears: Number(experienceYears),
        }),
      },
      create: {
        userId: id,
        location,
        education,
        skills: (skills || []).map((skill) => skill.trim()).filter(Boolean),
        experienceYears: experienceYears != null ? Number(experienceYears) : 0,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: profile,
    });
  } catch (error) {
    console.error("Update profile error:", error);
    return res.status(500).json({ success: false, message: "Failed to update profile" });
  }
};

module.exports = { getProfile, updateProfile };
