const test = require("node:test");
const assert = require("node:assert/strict");
const express = require("express");
const jwt = require("jsonwebtoken");

const { createChatController } = require("../src/controllers/chat.controller");
const { createChatRouter } = require("../src/routes/chat.routes");
const { AIServiceError } = require("../src/services/ai.service");
const chatRequestErrorHandler = require("../src/middleware/chat-request-error.middleware");

test("frontend chat API client completes an authenticated HTTP request through the backend route", async (t) => {
  const { createChatApi } = await import("../../frontend/src/services/chat-api.js");
  const previousSecret = process.env.JWT_SECRET;
  process.env.JWT_SECRET = "chat-e2e-test-secret";

  const retrievedUserIds = [];
  let receivedBody;
  let providerHistory;
  let rawPayload;
  const context = {
    candidateProfile: { education: "Diploma", skills: ["Python"], location: "Mohali", experienceYears: 0 },
    jobs: [{ id: 14, title: "Python trainee", company: "Test employer", location: "Mohali", skills: ["Python"] }],
    courses: [{ id: 7, title: "Python basics", provider: "Test provider", skills: ["Python"], url: "https://courses.example/python" }],
    sources: ["https://courses.example/python"],
    skillGaps: [],
    hasRelevantData: true,
  };
  const handler = createChatController({
    contextService: { retrieve: async ({ userId }) => {
      retrievedUserIds.push(userId);
      return context;
    } },
    provider: { generateReply: async ({ language, history }) => {
      providerHistory = history;
      return language === "hi" ? "आपके लिए एक Python प्रशिक्षण रिकॉर्ड मिला।" : "I found a Python training record for you.";
    } },
  });

  const app = express();
  app.use(express.json());
  app.post("/api/chat", (req, _res, next) => { receivedBody = req.body; next(); });
  app.use("/api/chat", createChatRouter(handler));
  const server = await new Promise((resolve) => {
    const listener = app.listen(0, "127.0.0.1", () => resolve(listener));
  });
  t.after(async () => {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    if (previousSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = previousSecret;
  });

  const token = jwt.sign({ userId: 42, role: "CANDIDATE" }, process.env.JWT_SECRET);
  const client = createChatApi({
    baseUrl: `http://127.0.0.1:${server.address().port}/api`,
    getToken: () => token,
    fetchImpl: async (...args) => {
      const response = await fetch(...args);
      rawPayload = await response.clone().json();
      return response;
    },
  });
  const history = [
    { role: "user", content: "I know Python and SQL." },
    { role: "assistant", content: "Are you interested in analytics?" },
  ];
  const result = await client.sendMessage({ message: "Find Python jobs", language: "hi", history, userId: 999 });

  assert.deepEqual(retrievedUserIds, [42], "only the verified JWT identity reaches profile retrieval");
  assert.deepEqual(receivedBody, { message: "Find Python jobs", language: "hi", history }, "the frontend sends history but omits arbitrary userId values");
  assert.deepEqual(providerHistory, history);
  assert.equal(result.reply, "आपके लिए एक Python प्रशिक्षण रिकॉर्ड मिला।");
  assert.equal(result.language, "hi");
  assert.deepEqual(result.jobs, context.jobs);
  assert.deepEqual(result.courses, context.courses);
  assert.deepEqual(result.sources, context.sources);
  assert.equal(typeof result.timestamp, "string");
  assert.deepEqual(Object.keys(rawPayload).sort(), ["data", "success"]);
  assert.equal(rawPayload.success, true);
  assert.deepEqual(Object.keys(rawPayload.data).sort(), ["courses", "grounding", "jobs", "language", "reply", "sources", "timestamp"]);

  const anonymousClient = createChatApi({
    baseUrl: `http://127.0.0.1:${server.address().port}/api`,
    getToken: () => null,
  });
  const anonymousResult = await anonymousClient.sendMessage({ message: "Find Python jobs" });
  assert.equal(anonymousResult.reply, "I found a Python training record for you.");
  assert.deepEqual(retrievedUserIds, [42, undefined], "anonymous chat does not read a candidate profile");
});

test("POST /api/chat returns a structured error when the AI provider fails", async (t) => {
  const handler = createChatController({
    contextService: { retrieve: async () => ({ jobs: [], courses: [], sources: [], hasRelevantData: false }) },
    provider: { generateReply: async () => {
      throw new AIServiceError("Safe provider message", { status: 503, code: "AI_PROVIDER_UNAVAILABLE" });
    } },
  });
  const app = express();
  app.use(express.json());
  app.use("/api/chat", createChatRouter(handler));
  app.use(chatRequestErrorHandler);
  const server = await new Promise((resolve) => {
    const listener = app.listen(0, "127.0.0.1", () => resolve(listener));
  });
  t.after(async () => new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve())));

  const response = await fetch(`http://127.0.0.1:${server.address().port}/api/chat`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: "Find jobs" }),
  });
  assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), {
    success: false,
    code: "AI_PROVIDER_UNAVAILABLE",
    message: "Safe provider message",
  });
});

test("frontend chat API client preserves backend error codes and rejects empty replies", async () => {
  const { createChatApi, ChatApiError } = await import("../../frontend/src/services/chat-api.js");
  const failedClient = createChatApi({
    fetchImpl: async () => new Response(JSON.stringify({ success: false, code: "AI_RATE_LIMITED", message: "Try again shortly." }), {
      status: 429,
      headers: { "Content-Type": "application/json" },
    }),
    getToken: () => null,
  });
  await assert.rejects(failedClient.sendMessage({ message: "Hello" }), (error) => {
    assert.ok(error instanceof ChatApiError);
    assert.equal(error.code, "AI_RATE_LIMITED");
    assert.equal(error.status, 429);
    return true;
  });

  const emptyClient = createChatApi({
    fetchImpl: async () => new Response(JSON.stringify({ success: true, data: { reply: "  " } }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }),
    getToken: () => null,
  });
  await assert.rejects(emptyClient.sendMessage({ message: "Hello" }), (error) => error.code === "EMPTY_AI_RESPONSE");

  const offlineClient = createChatApi({
    fetchImpl: async () => { throw new TypeError("Network unavailable"); },
    getToken: () => null,
  });
  await assert.rejects(offlineClient.sendMessage({ message: "Hello" }), (error) => error.code === "NETWORK_ERROR");
});

test("frontend bounds session history to recent complete turns", async () => {
  const { limitConversationHistory } = await import("../../frontend/src/services/chat-api.js");
  const longHistory = Array.from({ length: 22 }, (_, index) => ({
    role: index % 2 === 0 ? "user" : "assistant",
    content: `${index}: ${"context ".repeat(375)}`,
  }));
  const bounded = limitConversationHistory(longHistory);
  assert.ok(bounded.length <= 20);
  assert.equal(bounded[0].role, "user");
  assert.equal(bounded[bounded.length - 1].role, "assistant");
  assert.ok(bounded.every((entry) => entry.content.length <= 4000));
  assert.ok(bounded.reduce((size, entry) => size + entry.content.length, 0) <= 20000);
});

test("malformed chat JSON receives a structured client error", async (t) => {
  const app = express();
  app.use(express.json());
  app.post("/api/chat", (_req, res) => res.json({ success: true }));
  app.use(chatRequestErrorHandler);
  const server = await new Promise((resolve) => {
    const listener = app.listen(0, "127.0.0.1", () => resolve(listener));
  });
  t.after(async () => new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve())));

  const response = await fetch(`http://127.0.0.1:${server.address().port}/api/chat`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: "{bad json",
  });
  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), {
    success: false,
    code: "INVALID_JSON",
    message: "Request body must contain valid JSON.",
  });
});
