/**
 * Jooble Job Provider
 * -------------------
 * Fetches live job listings from the Jooble API and normalises them
 * into the standard PGRKAM job shape used by the live jobs endpoint.
 *
 * API docs: https://jooble.org/api/about
 * Request : POST https://jooble.org/api/<API_KEY>
 * Body    : { keywords: string, location: string, page?: number }
 * Response: { totalCount: number, jobs: RawJoobleJob[] }
 *
 * IMPORTANT: Jooble returns India-wide results even when a city name
 * is given as the location. The normalised job always uses the actual
 * location string returned by Jooble (e.g. "Chandigarh, India") – we
 * never re-label it as "Punjab" or any other region.
 */

"use strict";

const JOOBLE_TIMEOUT_MS = 10_000; // 10 seconds

/**
 * Normalise a single raw Jooble job object into the standard shape.
 *
 * Raw Jooble fields used:
 *   id        – unique job id (string)
 *   title     – job title
 *   company   – company / employer name
 *   location  – location string AS RETURNED BY JOOBLE (do not override)
 *   snippet   – short job description / snippet
 *   type      – employment type (e.g. "Full-time")
 *   link      – URL to the original Jooble listing
 *   updated   – ISO date string of last update
 *
 * @param {object} raw  Raw job object from the Jooble API response
 * @returns {object}    Normalised job object
 */
function normaliseJob(raw) {
  return {
    // Prefix the Jooble id so it cannot collide with database integer ids.
    id: `jooble-${raw.id || Math.random().toString(36).slice(2)}`,
    title: (raw.title || "").trim() || "Untitled",
    company: (raw.company || "").trim() || "Unknown",
    // Use the location exactly as Jooble returned it — never relabel to a region.
    location: (raw.location || "India").trim(),
    description: (raw.snippet || "").trim(),
    employmentType: (raw.type || "").trim() || null,
    source: "JOOBLE",
    sourceUrl: (raw.link || "").trim() || null,
    updatedAt: raw.updated || null,
  };
}

/**
 * Fetch live jobs from Jooble.
 *
 * @param {object} params
 * @param {string} params.keywords   Search keywords (default: "software developer")
 * @param {string} params.location   Location string (default: "India")
 * @param {object} params.env        process.env (injected for testability)
 * @returns {Promise<object[]>}      Array of normalised job objects
 */
async function fetchJoobleJobs({
  keywords = "software developer",
  location = "India",
  env = process.env,
} = {}) {
  const apiKey = env.JOOBLE_API_KEY?.trim();
  const apiUrl = env.JOOBLE_API_URL?.trim();

  if (!apiKey) {
    throw new Error("JOOBLE_API_KEY is not configured.");
  }
  if (!apiUrl) {
    throw new Error("JOOBLE_API_URL is not configured.");
  }

  const url = `${apiUrl}/${apiKey}`;

  // Use AbortController so we can apply a timeout without depending on extra packages.
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), JOOBLE_TIMEOUT_MS);

  let response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ keywords: keywords.trim(), location: location.trim() }),
      signal: controller.signal,
    });
  } catch (err) {
    if (err.name === "AbortError") {
      throw new Error(`Jooble request timed out after ${JOOBLE_TIMEOUT_MS / 1000}s.`);
    }
    throw new Error(`Jooble network error: ${err.message}`);
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    throw new Error(`Jooble returned HTTP ${response.status}.`);
  }

  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error("Jooble returned an invalid JSON response.");
  }

  // data.jobs may be null or missing if Jooble found nothing.
  const rawJobs = Array.isArray(data.jobs) ? data.jobs : [];
  return rawJobs.map(normaliseJob);
}

module.exports = { fetchJoobleJobs, normaliseJob };
