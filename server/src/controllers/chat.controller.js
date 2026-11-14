
const { aiService, AIServiceError } = require("../services/ai.service");
const { chatContextService } = require("../services/chat-context.service");
const {
  ChatHistoryValidationError,
  getChatInputLimits,
  validateConversationHistory,
} = require("../services/chat-history.service");

/**
 * POST /api/chat
 * Body: { message: string, language?: "en" | "hi" | "pa" }
 * Header: Authorization: Bearer <token>  (optional — allows personalized context)
 *
 * Sends the message to the configured AI provider.
 */
function createChatController({ contextService = chatContextService, provider = aiService, limits = getChatInputLimits() } = {}) {
  return async (req, res) => {
    try {
      const body = req.body;
      if (!body || typeof body !== "object" || Array.isArray(body)) {
        return res.status(400).json({ success: false, code: "INVALID_REQUEST_BODY", message: "Request body must be a JSON object." });
      }
      const { message } = body;

      if (typeof message !== "string" || message.trim() === "") {
        return res.status(400).json({
          success: false,
          code: "VALIDATION_ERROR",
          message: "Please provide a non-empty message",
        });
      }
      if (message.trim().length > limits.maxChatMessageChars) {
        return res.status(400).json({
          success: false,
          code: "MESSAGE_TOO_LARGE",
          message: `Messages must be ${limits.maxChatMessageChars} characters or fewer.`,
        });
      }
      const history = validateConversationHistory(body.history, limits);
      if (body.language !== undefined && !["en", "hi", "pa"].includes(body.language)) {
        return res.status(400).json({ success: false, code: "INVALID_LANGUAGE", message: "Language must be one of: en, hi, pa." });
      }
      const requestedLanguage = body.language || "en";

      // The identity comes only from verified JWT claims; ignore body.userId.
      const isCandidate = String(req.user?.role || "").toUpperCase() === "CANDIDATE";
      const userId = isCandidate ? req.user.userId : undefined;
      const context = await contextService.retrieve({ message: message.trim(), userId, history });

      let aiReply;
      try {
        aiReply = await provider.generateReply({
          message: message.trim(), context, language: requestedLanguage, history,
        });
        if (typeof aiReply !== "string" || !aiReply.trim()) {
          return res.status(502).json({ success: false, code: "AI_INVALID_RESPONSE", message: "The assistant returned an empty or invalid response. Please try again." });
        }
      } catch (aiError) {
        if (aiError instanceof AIServiceError) {
          console.error("AI service request failed:", aiError.code);
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
          reply: aiReply,
          language: requestedLanguage,
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
      if (error instanceof ChatHistoryValidationError) {
        return res.status(error.status).json({ success: false, code: error.code, message: error.message });
      }
      console.error("Chat request failed:", error?.name || "UnexpectedError");
      return res.status(502).json({
        success: false,
        code: "CHAT_SERVICE_ERROR",
        message: "The chat service is temporarily unavailable. Please try again.",
      });
    }
  };
}

const chat = createChatController();

module.exports = { chat, createChatController };
