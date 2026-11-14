
const prisma = require("../services/prisma.service");

/**
 * POST /api/chat
 * Body: { message: string }
 * Header: Authorization: Bearer <token>  (optional — allows personalized context)
 *
 * Connects to the Gemini AI service provided by Member 3.
 * Falls back gracefully if the AI service is unavailable.
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

    // Call the Gemini AI service (Member 3's service)
    const aiServiceUrl = process.env.AI_SERVICE_URL || "http://localhost:5002/api/ai/chat";

    let aiResponse;
    try {
      const fetch = (...args) =>
        import("node-fetch").then(({ default: f }) => f(...args));

      const payload = {
        message: message.trim(),
        ...(userContext && { context: userContext }),
      };

      const response = await fetch(aiServiceUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(10000), // 10 s timeout
      });

      if (!response.ok) {
        throw new Error(`AI service responded with status ${response.status}`);
      }

      const data = await response.json();
      aiResponse = data.reply || data.response || data.message || "No response from AI service.";
    } catch (aiError) {
      console.error("AI service error:", aiError.message);
      // Graceful fallback — return a helpful static message
      aiResponse =
        "I'm here to help you with job searches, skill recommendations, and career guidance on PGRKAM. The AI service is temporarily unavailable — please try again shortly.";
    }

    return res.status(200).json({
      success: true,
      data: {
        userMessage: message.trim(),
        aiReply: aiResponse,
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

module.exports = { chat };
