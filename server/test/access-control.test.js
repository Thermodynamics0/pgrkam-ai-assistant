const test = require("node:test");
const assert = require("node:assert/strict");
const authMiddleware = require("../src/middleware/auth.middleware");
const prisma = require("../src/services/prisma.service");
const { getProfile } = require("../src/controllers/profile.controller");

function response() {
  return {
    statusCode: 200, body: null,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };
}

test("role guard rejects anonymous users and candidates from privileged operations", () => {
  const guard = authMiddleware.requireRole("ADMIN", "EMPLOYER");
  for (const user of [undefined, { role: "CANDIDATE" }]) {
    const res = response();
    let passed = false;
    guard({ user }, res, () => { passed = true; });
    assert.equal(res.statusCode, 403);
    assert.equal(res.body.code, "FORBIDDEN");
    assert.equal(passed, false);
  }
  let passed = false;
  guard({ user: { role: "ADMIN" } }, response(), () => { passed = true; });
  assert.equal(passed, true);
});

test("candidate profile cannot be fetched using another user's route id", async () => {
  const original = prisma.user.findUnique;
  let queried = false;
  prisma.user.findUnique = async () => { queried = true; return { id: 2 }; };
  try {
    const res = response();
    await getProfile({ params: { id: "2" }, user: { userId: 1 } }, res);
    assert.equal(res.statusCode, 403);
    assert.equal(res.body.code, "FORBIDDEN");
    assert.equal(queried, false);
  } finally { prisma.user.findUnique = original; }
});
