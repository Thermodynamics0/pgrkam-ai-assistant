
const { aiService, AIServiceError } = require("../services/ai.service");
const { chatContextService } = require("../services/chat-context.service");

/**
 * POST /api/chat
 * Body: { message: string }
 * Header: Authorization: Bearer <token>  (optional — allows personalized context)
 *
 * Sends the message to the configured AI provider.
 */
function createChatController({ contextService = chatContextService, provider = aiService } = {}) {
  return async (req, res) => {
    try {
      const { message } = req.body;

      if (!message || typeof message !== "string" || message.trim() === "") {
        return res.status(400).json({
          success: false,
          message: "Please provide a non-empty message",
        });
      }

      // The identity comes only from verified JWT claims; ignore body.userId.
      const isCandidate = String(req.user?.role || "").toUpperCase() === "CANDIDATE";
      const userId = isCandidate ? req.user.userId : undefined;
      const context = await contextService.retrieve({ message: message.trim(), userId });

      let aiReply;
      try {
        aiReply = await provider.generateReply({ message: message.trim(), context });
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

      return res.status(200).json({
        success: true,
        data: {
          userMessage: message.trim(),
          aiReply,
          jobs: context.jobs,
          courses: context.courses,
          sources: context.sources,
          grounding: {
            dataFound: context.hasRelevantData,
            jobCount: context.jobs.length,
            courseCount: context.courses.length,
            message: context.hasRelevantData
              ? "Relevant records were found in the PGRKAM database."
              : "No relevant job or course records were found in the PGRKAM database.",
          },
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error("Chat controller error:", error);
      return res.status(500).json({
        success: false,
        message: "Chat request failed. Please try again.",
      });
    }
  };
}

const chat = createChatController();

module.exports = { chat, createChatController };
