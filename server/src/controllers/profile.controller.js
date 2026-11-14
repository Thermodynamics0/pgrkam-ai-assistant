
const prisma = require("../services/prisma.service");

// GET /api/profile  — get logged-in user's profile
const getProfile = async (req, res) => {
  try {
    const userId = req.user.userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
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

// PUT /api/profile  — create or update candidate profile
const updateProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { location, education, skills, experienceYears } = req.body;

    // Upsert: create if doesn't exist, update if it does
    const profile = await prisma.candidateProfile.upsert({
      where: { userId },
      update: {
        location,
        education,
        skills: skills || [],
        experienceYears: experienceYears !== undefined ? parseInt(experienceYears) : undefined,
      },
      create: {
        userId,
        location,
        education,
        skills: skills || [],
        experienceYears: experienceYears ? parseInt(experienceYears) : 0,
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
