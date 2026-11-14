
const prisma = require("../services/prisma.service");
const { rankJobsForProfile } = require("../services/recommendation.service");

/**
 * POST /api/recommendations
 * Body: { userId: number }   ← agreed contract (Member 2 + 3)
 *
 * Returns AI-powered job recommendations for the given candidate.
 * Scoring: skill overlap between candidate profile and job requirements.
 * Also saves/updates recommendations in the DB.
 */
const getRecommendations = async (req, res) => {
  try {
    // Accept userId from body (agreed contract) OR fall back to JWT
    const userId =
      req.body.userId !== undefined
        ? parseInt(req.body.userId)
        : req.user?.userId;

    if (!userId || isNaN(userId)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid userId",
      });
    }

    // Get candidate profile
    const profile = await prisma.candidateProfile.findUnique({
      where: { userId },
    });

    if (!profile || profile.skills.length === 0) {
      return res.status(400).json({
        success: false,
        message:
          "Candidate has no skills on their profile. Please update profile first.",
      });
    }

    // Get all jobs
    const jobs = await prisma.job.findMany({ orderBy: { createdAt: "desc" } });
    const scored = rankJobsForProfile(profile, jobs, 10);

    // Upsert recommendations into DB
    await Promise.all(
      scored.map(({ job, score, reason }) =>
        prisma.recommendation.upsert({
          where: { userId_jobId: { userId, jobId: job.id } },
          update: { score, reason },
          create: { userId, jobId: job.id, score, reason },
        })
      )
    );

    return res.status(200).json({
      success: true,
      count: scored.length,
      data: scored.map(({ job, score, reason }) => ({ job, score, reason })),
    });
  } catch (error) {
    console.error("Recommendation error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch recommendations",
    });
  }
};

/**
 * GET /api/recommendations/history
 * Returns previously saved recommendation records for the authenticated user.
 */
const getRecommendationHistory = async (req, res) => {
  try {
    const userId = req.user.userId;

    const records = await prisma.recommendation.findMany({
      where: { userId },
      include: { job: true },
      orderBy: { score: "desc" },
    });

    return res.status(200).json({
      success: true,
      count: records.length,
      data: records,
    });
  } catch (error) {
    console.error("Recommendation history error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch recommendation history",
    });
  }
};

module.exports = { getRecommendations, getRecommendationHistory };
