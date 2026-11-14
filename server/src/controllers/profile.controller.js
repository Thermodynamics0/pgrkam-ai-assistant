
const prisma = require("../services/prisma.service");

/**
 * GET /api/profile/:id
 * Returns the user and their candidate profile.
 * - Authenticated users can always fetch their own profile (:id matches token userId).
 * - Fetching another user's profile is also allowed (public read of profile data).
 */
const getProfile = async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({ success: false, message: "Invalid user ID" });
    }

    const user = await prisma.user.findUnique({
      where: { id },
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

    const { location, education, skills, experienceYears } = req.body;

    // Upsert: create if doesn't exist, update if it does
    const profile = await prisma.candidateProfile.upsert({
      where: { userId: id },
      update: {
        location,
        education,
        skills: skills || [],
        ...(experienceYears !== undefined && {
          experienceYears: parseInt(experienceYears),
        }),
      },
      create: {
        userId: id,
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
