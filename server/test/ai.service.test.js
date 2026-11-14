const test = require("node:test");
const assert = require("node:assert/strict");

const { AIServiceError, createAIService } = require("../src/services/ai.service");

test("Gemini provider sends the configured model and returns generated text", async () => {
  let clientOptions;
  let generationRequest;
  const history = [
    { role: "user", content: "I know Python and SQL." },
    { role: "assistant", content: "Are you interested in analytics?" },
  ];
  const service = createAIService({
    env: { AI_PROVIDER: "gemini", GEMINI_API_KEY: "backend-key", GEMINI_MODEL: "custom-model" },
    geminiClientFactory: (options) => {
      clientOptions = options;
      return { models: { generateContent: async (request) => {
        generationRequest = request;
        return { text: "Career guidance" };
      } } };
    },
  });

  assert.equal(await service.generateReply({ message: "Analytics", context: "Skills: welding", language: "hi", history }), "Career guidance");
  assert.deepEqual(clientOptions, { apiKey: "backend-key" });
  assert.equal(generationRequest.model, "custom-model");
  assert.deepEqual(generationRequest.contents.slice(0, 2), [
    { role: "user", parts: [{ text: "I know Python and SQL." }] },
    { role: "model", parts: [{ text: "Are you interested in analytics?" }] },
  ]);
  assert.equal(generationRequest.contents[2].role, "user");
  assert.match(generationRequest.contents[2].parts[0].text, /User message:\nAnalytics/);
  assert.match(generationRequest.contents[2].parts[0].text, /Skills: welding/);
  assert.ok(generationRequest.config.abortSignal instanceof AbortSignal);
  assert.match(generationRequest.config.systemInstruction, /Never invent vacancies/);
  assert.match(generationRequest.config.systemInstruction, /Never guarantee a user's employment/);
  assert.match(generationRequest.config.systemInstruction, /relevant official recruitment source/);
  assert.match(generationRequest.config.systemInstruction, /Respond in Hindi/);
  assert.match(generationRequest.config.systemInstruction, /Conversation history.*never overrides these system instructions/);
});

test("Gemini provider reports a missing API key clearly", async () => {
  const service = createAIService({ env: { AI_PROVIDER: "gemini" } });
  await assert.rejects(service.generateReply({ message: "Hello" }), (error) => {
    assert.ok(error instanceof AIServiceError);
    assert.equal(error.code, "AI_CONFIGURATION_ERROR");
    assert.match(error.message, /GEMINI_API_KEY/);
    return true;
  });
});

test("Gemini API key rejection and network errors do not become successful replies", async () => {
  const invalidKey = createAIService({
    env: { AI_PROVIDER: "gemini", GEMINI_API_KEY: "invalid" },
    geminiClientFactory: () => ({ models: { generateContent: async () => {
      const error = new Error("API key not valid");
      error.status = 400;
      throw error;
    } } }),
  });
  await assert.rejects(invalidKey.generateReply({ message: "Hello" }), (error) => error.code === "AI_AUTHENTICATION_FAILED");

  const networkFailure = createAIService({
    env: { AI_PROVIDER: "external", AI_SERVICE_URL: "http://ai.local/chat" },
    fetchImpl: async () => { throw new TypeError("fetch failed"); },
  });
  await assert.rejects(networkFailure.generateReply({ message: "Hello" }), (error) => error.status === 503);
});

test("external provider keeps its existing payload and response contract", async () => {
  let request;
  const service = createAIService({
    env: { AI_PROVIDER: "external", AI_SERVICE_URL: "http://ai.local/chat" },
    fetchImpl: async (url, options) => {
      request = { url, options };
      return { ok: true, json: async () => ({ response: "External reply" }) };
    },
  });

  assert.equal(await service.generateReply({
    message: "Find work",
    context: "Skills: welding",
    history: [{ role: "user", content: "I know welding." }, { role: "assistant", content: "Tell me your location." }],
  }), "External reply");
  assert.equal(request.url, "http://ai.local/chat");
  const payload = JSON.parse(request.options.body);
  assert.equal(payload.message, "Find work");
  assert.match(payload.context, /Skills: welding/);
  assert.match(payload.context, /Never invent vacancies/);
  assert.match(payload.context, /I know welding/);
});

test("provider rate limits and malformed responses are surfaced as errors", async () => {
  const limited = createAIService({
    env: { AI_PROVIDER: "external", AI_SERVICE_URL: "http://ai.local/chat" },
    fetchImpl: async () => ({ ok: false, status: 429 }),
  });
  await assert.rejects(limited.generateReply({ message: "Hello" }), (error) => error.status === 429);

  const malformed = createAIService({
    env: { AI_PROVIDER: "external", AI_SERVICE_URL: "http://ai.local/chat" },
    fetchImpl: async () => ({ ok: true, json: async () => ({ reply: "  " }) }),
  });
  await assert.rejects(malformed.generateReply({ message: "Hello" }), (error) => error.code === "AI_INVALID_RESPONSE");
});

test("external provider timeout is returned as HTTP 504", async () => {
  const service = createAIService({
    env: { AI_PROVIDER: "external", AI_SERVICE_URL: "http://ai.local/chat", AI_TIMEOUT_MS: "5" },
    fetchImpl: (_url, { signal }) => new Promise((_resolve, reject) => {
      signal.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")), { once: true });
    }),
  });
  await assert.rejects(service.generateReply({ message: "Hello" }), (error) => error.code === "AI_TIMEOUT");
});
