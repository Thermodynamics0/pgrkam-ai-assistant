const test = require("node:test");
const assert = require("node:assert/strict");

const { createChatController } = require("../src/controllers/chat.controller");

function responseRecorder() {
  return {
    statusCode: 200,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };
}

test("chat context uses the authenticated JWT identity and returns database records separately", async () => {
  let retrievalArgs;
  let providerArgs;
  const context = {
    candidateProfile: { education: "Diploma", skills: ["Python"], location: "Ludhiana", experienceYears: 0 },
    jobs: [{ id: 5, title: "Python trainee" }],
    courses: [{ id: 9, title: "Python basics" }],
    sources: ["https://example.test/course"],
    skillGaps: [],
    hasRelevantData: true,
  };
  const handler = createChatController({
    contextService: { retrieve: async (args) => { retrievalArgs = args; return context; } },
    provider: { generateReply: async (args) => { providerArgs = args; return "These records may help."; } },
  });
  const res = responseRecorder();

  await handler({ body: { message: "Find a job", userId: 999 }, user: { userId: 7, role: "CANDIDATE" } }, res);

  assert.equal(retrievalArgs.userId, 7);
  assert.equal(retrievalArgs.message, "Find a job");
  assert.equal(providerArgs.context, context);
  assert.deepEqual(res.body.data.jobs, context.jobs);
  assert.deepEqual(res.body.data.courses, context.courses);
  assert.deepEqual(res.body.data.sources, context.sources);
  assert.equal(res.body.data.grounding.dataFound, true);
});

test("chat ignores a body userId when no authenticated JWT identity exists", async () => {
  let retrievalArgs;
  const handler = createChatController({
    contextService: { retrieve: async (args) => {
      retrievalArgs = args;
      return { candidateProfile: null, jobs: [], courses: [], sources: [], skillGaps: [], hasRelevantData: false };
    } },
    provider: { generateReply: async () => "No records were found." },
  });
  const res = responseRecorder();

  await handler({ body: { message: "Find jobs", userId: 999 } }, res);

  assert.equal(retrievalArgs.userId, undefined);
  assert.equal(res.body.data.grounding.dataFound, false);
});
