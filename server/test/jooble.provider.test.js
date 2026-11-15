/**
 * Jooble Provider Tests
 * ---------------------
 * Tests the normaliseJob() function and fetchJoobleJobs() against
 * a mocked fetch so no real network call is made.
 *
 * Run with:  node --test server/test/jooble.provider.test.js
 */

"use strict";

const test   = require("node:test");
const assert = require("node:assert/strict");
const path   = require("node:path");

// Load the module under test directly.
const { normaliseJob, fetchJoobleJobs } = require(
  path.join(__dirname, "../src/services/providers/jooble.provider.js")
);

// ─── normaliseJob ────────────────────────────────────────────────────────────

test("normaliseJob: maps all Jooble fields to the standard shape", () => {
  const raw = {
    id: "abc123",
    title: "  Software Engineer  ",
    company: "TechCorp",
    location: "Chandigarh, India",
    snippet: "Build cool things.",
    type: "Full-time",
    link: "https://jooble.org/jdp/abc123",
    updated: "2024-11-14",
  };

  const result = normaliseJob(raw);

  assert.equal(result.id, "jooble-abc123");
  assert.equal(result.title, "Software Engineer");
  assert.equal(result.company, "TechCorp");
  assert.equal(result.location, "Chandigarh, India");
  assert.equal(result.description, "Build cool things.");
  assert.equal(result.employmentType, "Full-time");
  assert.equal(result.source, "JOOBLE");
  assert.equal(result.sourceUrl, "https://jooble.org/jdp/abc123");
  assert.equal(result.updatedAt, "2024-11-14");
});

test("normaliseJob: uses safe defaults for missing fields", () => {
  const result = normaliseJob({});

  assert.match(result.id, /^jooble-/);
  assert.equal(result.title, "Untitled");
  assert.equal(result.company, "Unknown");
  assert.equal(result.location, "India"); // default location
  assert.equal(result.description, "");
  assert.equal(result.employmentType, null);
  assert.equal(result.source, "JOOBLE");
  assert.equal(result.sourceUrl, null);
  assert.equal(result.updatedAt, null);
});

test("normaliseJob: trims whitespace from all string fields", () => {
  const result = normaliseJob({
    id: "x",
    title: "  Dev  ",
    company: "  Co  ",
    location: "  Delhi  ",
    snippet: "  Work here.  ",
    type: "  Part-time  ",
    link: "  https://jooble.org/x  ",
  });

  assert.equal(result.title, "Dev");
  assert.equal(result.company, "Co");
  assert.equal(result.location, "Delhi");
  assert.equal(result.description, "Work here.");
  assert.equal(result.employmentType, "Part-time");
  assert.equal(result.sourceUrl, "https://jooble.org/x");
});

test("normaliseJob: does NOT relabel location even if requested for a Punjab city", () => {
  // Jooble returns "Chandigarh, India" — we must keep that exactly, not relabel
  const result = normaliseJob({ id: "y", location: "Chandigarh, India" });
  assert.equal(result.location, "Chandigarh, India");
  assert.ok(!result.location.includes("Punjab") || result.location === "Chandigarh, India",
    "Location must not be relabelled");
});

test("normaliseJob: prefixes id with 'jooble-' to avoid collisions with DB ids", () => {
  const result = normaliseJob({ id: "99999" });
  assert.ok(result.id.startsWith("jooble-"), "id must start with 'jooble-'");
  assert.ok(!result.id.startsWith("jooble-jooble-"), "id must not double-prefix");
});

// ─── fetchJoobleJobs ─────────────────────────────────────────────────────────

// Save and restore global.fetch between tests.
let originalFetch;
test("fetchJoobleJobs: returns normalised jobs on success", async () => {
  originalFetch = global.fetch;
  global.fetch = async () => ({
    ok: true,
    status: 200,
    json: async () => ({
      totalCount: 2,
      jobs: [
        { id: "1", title: "Dev", company: "A", location: "Delhi", snippet: "s", type: "Full-time", link: "https://j.org/1" },
        { id: "2", title: "Analyst", company: "B", location: "Mumbai", snippet: "t", type: null, link: "https://j.org/2" },
      ],
    }),
  });

  const env = { JOOBLE_API_KEY: "test-key", JOOBLE_API_URL: "https://jooble.org/api" };
  const jobs = await fetchJoobleJobs({ keywords: "dev", location: "India", env });

  assert.equal(jobs.length, 2);
  assert.equal(jobs[0].id, "jooble-1");
  assert.equal(jobs[0].source, "JOOBLE");
  global.fetch = originalFetch;
});

test("fetchJoobleJobs: returns empty array when Jooble returns no jobs", async () => {
  originalFetch = global.fetch;
  global.fetch = async () => ({
    ok: true,
    status: 200,
    json: async () => ({ totalCount: 0, jobs: null }),
  });

  const env = { JOOBLE_API_KEY: "test-key", JOOBLE_API_URL: "https://jooble.org/api" };
  const jobs = await fetchJoobleJobs({ env });
  assert.equal(jobs.length, 0);
  global.fetch = originalFetch;
});

test("fetchJoobleJobs: throws if JOOBLE_API_KEY is missing", async () => {
  await assert.rejects(
    () => fetchJoobleJobs({ env: { JOOBLE_API_URL: "https://jooble.org/api" } }),
    /JOOBLE_API_KEY is not configured/
  );
});

test("fetchJoobleJobs: throws if JOOBLE_API_URL is missing", async () => {
  await assert.rejects(
    () => fetchJoobleJobs({ env: { JOOBLE_API_KEY: "key" } }),
    /JOOBLE_API_URL is not configured/
  );
});

test("fetchJoobleJobs: throws on non-ok HTTP response", async () => {
  originalFetch = global.fetch;
  global.fetch = async () => ({ ok: false, status: 429 });

  await assert.rejects(
    () => fetchJoobleJobs({ env: { JOOBLE_API_KEY: "k", JOOBLE_API_URL: "https://jooble.org/api" } }),
    /HTTP 429/
  );
  global.fetch = originalFetch;
});

test("fetchJoobleJobs: throws on network error", async () => {
  originalFetch = global.fetch;
  global.fetch = async () => { throw new Error("ECONNREFUSED"); };

  await assert.rejects(
    () => fetchJoobleJobs({ env: { JOOBLE_API_KEY: "k", JOOBLE_API_URL: "https://jooble.org/api" } }),
    /network error/i
  );
  global.fetch = originalFetch;
});
