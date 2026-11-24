/**
 * Live Job Controller
 * -------------------
 * Handles GET /api/jobs/live
 *
 * Query parameters:
 *   keywords  – search keywords (default: "software developer")
 *   location  – location string (default: "India")
 *
 * Response: { success: true, count: number, data: NormalisedJob[] }
 *
 * This controller only calls the Jooble provider. It does NOT touch
 * the database, so no Prisma migration is needed.
 */

"use strict";

const { fetchJoobleJobs } = require("../services/jooble.provider");

/**
 * GET /api/jobs/live
 */
const getLiveJobs = async (req, res) => {
  // Sanitise query params – trim whitespace, fall back to safe defaults.
  const keywords = (req.query.keywords || "software developer").trim();
  const location = (req.query.location || "India").trim();

  try {
    const jobs = await fetchJoobleJobs({ keywords, location });

    return res.status(200).json({
      success: true,
      count: jobs.length,
      data: jobs,
    });
  } catch (error) {
    // Log the real error server-side but return a safe message to the client.
    console.error("Live jobs provider failure:", error.name || "Error");

    // Distinguish timeout / network errors from configuration errors.
    const isConfig = error.message.includes("not configured");
    return res.status(isConfig ? 503 : 502).json({
      success: false,
      message: isConfig
        ? "Live job search is not available (server configuration issue)."
        : "Could not fetch live jobs. The external service may be temporarily unavailable.",
      code: isConfig ? "LIVE_JOBS_NOT_CONFIGURED" : "LIVE_JOBS_UNAVAILABLE",
    });
  }
};

module.exports = { getLiveJobs };
