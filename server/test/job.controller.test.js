const test = require("node:test");
const assert = require("node:assert/strict");
const prisma = require("../src/services/prisma.service");
const { getJobs } = require("../src/controllers/job.controller");

function response() {
  return { statusCode: 200, body: null, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } };
}

test("job search includes skill matches and caps returned rows", async () => {
  const original = prisma.job.findMany;
  let query;
  prisma.job.findMany = async (input) => { query = input; return []; };
  try {
    const res = response();
    await getJobs({ query: { search: "Python SQL", location: "Pune" } }, res);
    assert.equal(res.statusCode, 200);
    assert.equal(query.take, 100);
    assert.ok(query.where.OR.some((clause) => clause.skills?.hasSome.includes("Python")));
    assert.ok(query.where.OR.some((clause) => clause.skills?.hasSome.includes("sql")));
    assert.equal(query.where.location.contains, "Pune");
  } finally { prisma.job.findMany = original; }
});
