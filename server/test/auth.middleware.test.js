const test = require("node:test");
const assert = require("node:assert/strict");
const authMiddleware = require("../src/middleware/auth.middleware");

test("authentication refuses tokens when the JWT signing secret is not configured", () => {
  const previous = process.env.JWT_SECRET;
  delete process.env.JWT_SECRET;
  const res = {
    statusCode: 200, body: null,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };
  let nextCalled = false;
  try {
    authMiddleware({ headers: { authorization: "Bearer forged" } }, res, () => { nextCalled = true; });
    assert.equal(res.statusCode, 503);
    assert.equal(res.body.code, "AUTH_CONFIGURATION_ERROR");
    assert.equal(nextCalled, false);
  } finally {
    if (previous === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = previous;
  }
});
