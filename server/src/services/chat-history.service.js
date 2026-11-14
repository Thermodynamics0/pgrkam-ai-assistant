const MAX_HISTORY_MESSAGES = 20;
const MAX_HISTORY_MESSAGE_CHARS = 4000;
const MAX_HISTORY_TOTAL_CHARS = 20000;
const MAX_CHAT_MESSAGE_CHARS = 4000;

function configuredLimit(envValue, fallback, minimum = 1, maximum = 100000) {
  if (envValue === undefined || envValue === "") return fallback;
  const value = Number(envValue);
  return Number.isSafeInteger(value) && value >= minimum && value <= maximum ? value : fallback;
}

function getChatInputLimits(env = process.env) {
  return {
    maxHistoryMessages: configuredLimit(env.AI_CHAT_MAX_HISTORY_MESSAGES, MAX_HISTORY_MESSAGES, 0, 40),
    maxHistoryMessageChars: configuredLimit(env.AI_CHAT_MAX_HISTORY_MESSAGE_CHARS, MAX_HISTORY_MESSAGE_CHARS, 1, 10000),
    maxHistoryTotalChars: configuredLimit(env.AI_CHAT_MAX_HISTORY_TOTAL_CHARS, MAX_HISTORY_TOTAL_CHARS, 1, 50000),
    maxChatMessageChars: configuredLimit(env.AI_CHAT_MAX_MESSAGE_CHARS, MAX_CHAT_MESSAGE_CHARS, 1, 10000),
  };
}

class ChatHistoryValidationError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "ChatHistoryValidationError";
    this.code = code;
    this.status = 400;
  }
}

function validateConversationHistory(history, limits = getChatInputLimits()) {
  if (history === undefined) return [];
  if (!Array.isArray(history)) {
    throw new ChatHistoryValidationError("INVALID_HISTORY", "Conversation history must be an array.");
  }
  if (history.length > limits.maxHistoryMessages) {
    throw new ChatHistoryValidationError("HISTORY_LIMIT_EXCEEDED", `Conversation history cannot exceed ${limits.maxHistoryMessages} messages.`);
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
    if (content.length > limits.maxHistoryMessageChars) {
      throw new ChatHistoryValidationError("HISTORY_MESSAGE_TOO_LARGE", `Each history message must be ${limits.maxHistoryMessageChars} characters or fewer.`);
    }
    totalChars += content.length;
    if (totalChars > limits.maxHistoryTotalChars) {
      throw new ChatHistoryValidationError("HISTORY_TOO_LARGE", `Conversation history must be ${limits.maxHistoryTotalChars} characters or fewer in total.`);
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
  getChatInputLimits,
  ChatHistoryValidationError,
  validateConversationHistory,
};
