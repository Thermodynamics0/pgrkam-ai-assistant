const test = require("node:test");
const assert = require("node:assert/strict");
const express = require("express");
const jwt = require("jsonwebtoken");

const { createChatController } = require("../src/controllers/chat.controller");
const { createChatRouter } = require("../src/routes/chat.routes");

test("frontend chat API client completes an authenticated HTTP request through the backend route", async (t) => {
  const { createChatApi } = await import("../../frontend/src/services/chat-api.js");
  const previousSecret = process.env.JWT_SECRET;
  process.env.JWT_SECRET = "chat-e2e-test-secret";

  let retrievedUserId;
  let receivedBody;
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
      retrievedUserId = userId;
      return context;
    } },
    provider: { generateReply: async ({ language }) => language === "hi" ? "आपके लिए एक Python प्रशिक्षण रिकॉर्ड मिला।" : "I found a Python training record for you." },
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
  });
  const result = await client.sendMessage({ message: "Find Python jobs", language: "hi", userId: 999 });

  assert.equal(retrievedUserId, 42, "only the verified JWT identity reaches profile retrieval");
  assert.deepEqual(receivedBody, { message: "Find Python jobs", language: "hi" }, "the frontend omits arbitrary userId values");
  assert.equal(result.reply, "आपके लिए एक Python प्रशिक्षण रिकॉर्ड मिला।");
  assert.equal(result.language, "hi");
  assert.deepEqual(result.jobs, context.jobs);
  assert.deepEqual(result.courses, context.courses);
  assert.deepEqual(result.sources, context.sources);
  assert.equal(typeof result.timestamp, "string");
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
