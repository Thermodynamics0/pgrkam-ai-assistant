const test = require("node:test");
const assert = require("node:assert/strict");

const { createChatContextService } = require("../src/services/chat-context.service");

test("retrieves bounded job and course records using candidate skills and question terms", async () => {
  let profileQuery;
  let jobQuery;
  let courseQuery;
  const db = {
    candidateProfile: { findUnique: async (query) => {
      profileQuery = query;
      return { education: "Diploma", skills: ["Python"], location: "Ludhiana", experienceYears: 0 };
    } },
    job: { findMany: async (query) => {
      jobQuery = query;
      return [
        { id: 1, title: "Junior Analyst", company: "PGRKAM employer", location: "Ludhiana", description: "Python data role", skills: ["Python", "SQL"], employmentType: "Full-time" },
        { id: 2, title: "Python Developer", company: "Local employer", location: "Punjab", description: "Entry role", skills: ["Python"], employmentType: "Internship" },
      ];
    } },
    course: { findMany: async (query) => {
      courseQuery = query;
      return [
        { id: 3, title: "SQL Basics", provider: "NIELIT", description: "Introductory SQL", url: "https://courses.example/sql", skills: ["SQL"] },
        { id: 4, title: "Unsafe URL", provider: "Example", description: null, url: "javascript:alert(1)", skills: [] },
      ];
    } },
  };
  const contextService = createChatContextService({ db });

  const context = await contextService.retrieve({
    message: "Find jobs for a fresher who knows Python and courses to learn SQL",
    userId: 8,
  });

  assert.deepEqual(profileQuery.where, { userId: 8 });
  assert.deepEqual(Object.keys(profileQuery.select).sort(), ["education", "experienceYears", "location", "skills"]);
  assert.equal(Object.hasOwn(context.candidateProfile, "userId"), false);
  assert.equal(jobQuery.take, 24);
  assert.ok(jobQuery.where.OR.some((clause) => clause.skills?.hasSome.includes("Python")));
  assert.equal(context.jobs.length, 2);
  assert.equal(context.jobs[0].id, 2, "the profile skill match with the highest skill coverage ranks first");
  assert.deepEqual(context.skillGaps, ["SQL"]);
  assert.equal(courseQuery.take, 6);
  assert.deepEqual(context.sources, ["https://courses.example/sql"]);
  assert.equal(context.courses[1].url, null);
  assert.equal(context.hasRelevantData, true);
});

test("anonymous queries do not access a candidate profile and limits job results", async () => {
  let jobQuery;
  const db = {
    candidateProfile: { findUnique: async () => { throw new Error("should not query profiles"); } },
    job: { findMany: async (query) => { jobQuery = query; return Array(9).fill(null).map((_, id) => ({ id, skills: [] })); } },
    course: { findMany: async () => [] },
  };
  const context = await createChatContextService({ db }).retrieve({ message: "Show me job opportunities" });
  assert.equal(jobQuery.take, 24);
  assert.deepEqual(jobQuery.where, {}, "a broad job request returns a bounded set of recent records");
  assert.equal(context.jobs.length, 6);
  assert.equal(context.candidateProfile, null);
});

test("short follow-ups reuse recent employment context to retrieve matching records", async () => {
  let jobQuery;
  const db = {
    candidateProfile: { findUnique: async () => null },
    job: { findMany: async (query) => {
      jobQuery = query;
      return [{ id: 11, title: "Analytics assistant", company: "Data employer", location: "Punjab", description: "Python and SQL analysis", skills: ["Python", "SQL"] }];
    } },
    course: { findMany: async () => [] },
  };
  const history = [
    { role: "user", content: "I know Python and SQL." },
    { role: "assistant", content: "Are you interested in analytics or software development?" },
  ];

  const context = await createChatContextService({ db }).retrieve({ message: "Analytics", history });

  assert.ok(jobQuery, "a short follow-up inherits the job-search intent from the prior turn");
  assert.ok(jobQuery.where.OR.some((clause) => clause.skills?.hasSome.includes("Python")));
  assert.equal(context.jobs[0].id, 11);
});
