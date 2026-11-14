
const prisma = require("../services/prisma.service");
const { aiService, AIServiceError } = require("../services/ai.service");

/**
 * POST /api/chat
 * Body: { message: string }
 * Header: Authorization: Bearer <token>  (optional — allows personalized context)
 *
 * Sends the message to the configured AI provider.
 */
const chat = async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || typeof message !== "string" || message.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Please provide a non-empty message",
      });
    }

    // Build user context if authenticated
    let userContext = null;
    if (req.user) {
      const userId = req.user.userId;
      const profile = await prisma.candidateProfile.findUnique({
        where: { userId },
      });
      userContext = profile
        ? `User skills: ${profile.skills.join(", ")}. Location: ${profile.location || "not set"}. Experience: ${profile.experienceYears} years.`
        : null;
    }

    try {
      const aiReply = await aiService.generateReply({
        message: message.trim(),
        context: userContext,
      });

      return res.status(200).json({
        success: true,
        data: {
          userMessage: message.trim(),
          aiReply,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (aiError) {
      if (aiError instanceof AIServiceError) {
        console.error("AI service error:", aiError.code, aiError.message);
        return res.status(aiError.status).json({
          success: false,
          code: aiError.code,
          message: aiError.message,
        });
      }
      throw aiError;
    }
  } catch (error) {
    console.error("Chat controller error:", error);
    return res.status(500).json({
      success: false,
      message: "Chat request failed. Please try again.",
    });
  }
};

module.exports = { chat };
