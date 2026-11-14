const test = require("node:test");
const assert = require("node:assert/strict");
const { createChatRateLimiter } = require("../src/middleware/chat-rate-limit.middleware");

function responseRecorder() {
  return {
    headers: {}, statusCode: 200, body: null,
    set(name, value) { this.headers[name] = value; return this; },
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };
}

test("chat limiter returns a clear 429 response and resets after its window", () => {
  let time = 1000;
  const limit = createChatRateLimiter({ env: { AI_CHAT_RATE_LIMIT_MAX: "2", AI_CHAT_RATE_LIMIT_WINDOW_MS: "1000" }, now: () => time });
  let passed = 0;
  const makeRequest = () => {
    const res = responseRecorder();
    limit({ ip: "127.0.0.1" }, res, () => { passed += 1; });
    return res;
  };

  makeRequest();
  makeRequest();
  const limited = makeRequest();
  assert.equal(passed, 2);
  assert.equal(limited.statusCode, 429);
  assert.equal(limited.body.code, "CHAT_RATE_LIMITED");
  assert.equal(limited.headers["Retry-After"], "1");

  time += 1000;
  assert.equal(makeRequest().statusCode, 200);
});
