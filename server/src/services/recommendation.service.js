function rankJobsForProfile(profile, jobs, limit = 10) {
  const candidateSkills = (profile?.skills || []).map((skill) => skill.trim().toLowerCase()).filter(Boolean);
  if (candidateSkills.length === 0) return [];

  return jobs
    .map((job) => {
      const jobSkills = (job.skills || []).map((skill) => skill.trim().toLowerCase()).filter(Boolean);
      const matched = candidateSkills.filter((skill) => jobSkills.includes(skill));
      const score = jobSkills.length > 0 ? Number((matched.length / jobSkills.length).toFixed(2)) : 0;
      const reason = matched.length > 0
        ? `Your skills match: ${matched.join(", ")}`
        : "General opportunity — consider upskilling for a better match";
      return { job, score, reason };
    })
    .filter((result) => result.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

module.exports = { rankJobsForProfile };
