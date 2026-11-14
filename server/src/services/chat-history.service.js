const MAX_HISTORY_MESSAGES = 20;
const MAX_HISTORY_MESSAGE_CHARS = 4000;
const MAX_HISTORY_TOTAL_CHARS = 20000;
const MAX_CHAT_MESSAGE_CHARS = 4000;

class ChatHistoryValidationError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "ChatHistoryValidationError";
    this.code = code;
    this.status = 400;
  }
}

function validateConversationHistory(history) {
  if (history === undefined) return [];
  if (!Array.isArray(history)) {
    throw new ChatHistoryValidationError("INVALID_HISTORY", "Conversation history must be an array.");
  }
  if (history.length > MAX_HISTORY_MESSAGES) {
    throw new ChatHistoryValidationError("HISTORY_LIMIT_EXCEEDED", `Conversation history cannot exceed ${MAX_HISTORY_MESSAGES} messages.`);
  }

  let totalChars = 0;
  const validated = history.map((entry, index) => {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
      throw new ChatHistoryValidationError("INVALID_HISTORY", `Conversation history entry ${index + 1} is invalid.`);
    }
    if (entry.role !== "user" && entry.role !== "assistant") {
      throw new ChatHistoryValidationError("INVALID_HISTORY_ROLE", "Conversation history roles must be 'user' or 'assistant'.");
    }
    if (entry.role !== (index % 2 === 0 ? "user" : "assistant")) {
      throw new ChatHistoryValidationError("INVALID_HISTORY_ORDER", "Conversation history must alternate between user and assistant messages.");
    }
    if (typeof entry.content !== "string" || !entry.content.trim()) {
      throw new ChatHistoryValidationError("INVALID_HISTORY", `Conversation history entry ${index + 1} must contain text.`);
    }
    const content = entry.content.trim();
    if (content.length > MAX_HISTORY_MESSAGE_CHARS) {
      throw new ChatHistoryValidationError("HISTORY_MESSAGE_TOO_LARGE", `Each history message must be ${MAX_HISTORY_MESSAGE_CHARS} characters or fewer.`);
    }
    totalChars += content.length;
    if (totalChars > MAX_HISTORY_TOTAL_CHARS) {
      throw new ChatHistoryValidationError("HISTORY_TOO_LARGE", `Conversation history must be ${MAX_HISTORY_TOTAL_CHARS} characters or fewer in total.`);
    }
    return { role: entry.role, content };
  });

  if (validated.length > 0 && validated[validated.length - 1].role !== "assistant") {
    throw new ChatHistoryValidationError("INVALID_HISTORY_ORDER", "Conversation history must contain complete user and assistant turns.");
  }
  return validated;
}

module.exports = {
  MAX_HISTORY_MESSAGES,
  MAX_HISTORY_MESSAGE_CHARS,
  MAX_HISTORY_TOTAL_CHARS,
  MAX_CHAT_MESSAGE_CHARS,
  ChatHistoryValidationError,
  validateConversationHistory,
};
