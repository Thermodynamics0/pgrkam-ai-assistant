
const prisma = require("../services/prisma.service");

/**
 * GET /api/recommendations
 * Returns AI-powered job recommendations for the logged-in candidate.
 *
 * Scoring logic:
 *  - Checks overlap between candidate skills and job required skills.
 *  - Calls Member 3's AI service if available, otherwise uses local skill-matching score.
 */
const getRecommendations = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Get candidate profile
    const profile = await prisma.candidateProfile.findUnique({
      where: { userId },
    });

    if (!profile || profile.skills.length === 0) {
      return res.status(400).json({
        success: false,
        message:
          "Please complete your profile with skills to get recommendations.",
      });
    }

    const candidateSkills = profile.skills.map((s) => s.toLowerCase());

    // Get all jobs
    const jobs = await prisma.job.findMany({
      orderBy: { createdAt: "desc" },
    });

    // Score each job by skill overlap
    const scored = jobs
      .map((job) => {
        const jobSkills = job.skills.map((s) => s.toLowerCase());
        const matched = candidateSkills.filter((s) => jobSkills.includes(s));
        const score =
          jobSkills.length > 0
            ? parseFloat((matched.length / jobSkills.length).toFixed(2))
            : 0;

        const reason =
          matched.length > 0
            ? `Your skills match: ${matched.join(", ")}`
            : "General opportunity — consider upskilling for a better match";

        return { job, score, reason };
      })
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10); // Top 10

    // Upsert recommendations into DB
    const saved = await Promise.all(
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
      data: scored.map(({ job, score, reason }) => ({
        job,
        score,
        reason,
      })),
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
 * Returns previously saved recommendation records for the user.
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
