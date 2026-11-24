const prisma = require("./prisma.service");
const { rankJobsForProfile } = require("./recommendation.service");

const MAX_SEARCH_TERMS = 10;
const MAX_JOB_RESULTS = 6;
const MAX_COURSE_RESULTS = 6;
const STOP_WORDS = new Set([
  "about", "and", "are", "available", "best", "career", "careers", "employment", "for", "from", "get", "give", "good", "help", "how", "i", "in", "is", "it",
  "job", "jobs", "me", "my", "of", "on", "opportunit", "opportunities", "opening", "openings", "path", "paths", "please", "recommend", "role", "roles", "should", "show", "some", "the", "to",
  "find", "latest", "list", "newest", "want", "what", "which", "who", "with", "you", "your",
  "vacancy", "vacancies",
]);
const SEARCH_EQUIVALENTS = new Map(Object.entries({
  "नौकरी": ["job", "jobs"], "नौकरियां": ["job", "jobs"], "नौकरियाँ": ["job", "jobs"],
  "काम": ["employment", "work"], "रोज़गार": ["employment", "jobs"], "रोजगार": ["employment", "jobs"],
  "वेतन": ["salary"], "तनख्वाह": ["salary"], "करियर": ["career"], "भर्ती": ["recruitment", "hiring"],
  "अवसर": ["opportunity", "jobs"], "फ्रेशर": ["fresher", "entry"], "कौशल": ["skills"], "हुनर": ["skills"],
  "सीखें": ["learn", "course"], "सीखना": ["learn", "course"], "कोर्स": ["course", "training"], "प्रशिक्षण": ["training", "course"],
  "डेटा": ["data"], "डाटा": ["data"], "विश्लेषक": ["analyst"], "विश्लेषण": ["analysis", "analytics"],
  "इंजीनियर": ["engineer"], "सॉफ्टवेयर": ["software"], "सरकारी": ["government"], "पुणे": ["Pune"], "पंजाब": ["Punjab"],
  "ਨੌਕਰੀ": ["job", "jobs"], "ਨੌਕਰੀਆਂ": ["job", "jobs"], "ਕੰਮ": ["employment", "work"],
  "ਤਨਖਾਹ": ["salary"], "ਕਰੀਅਰ": ["career"], "ਭਰਤੀ": ["recruitment", "hiring"], "ਮੌਕੇ": ["opportunity", "jobs"],
  "ਹੁਨਰ": ["skills"], "ਸਿੱਖੋ": ["learn", "course"], "ਸਿੱਖਣਾ": ["learn", "course"], "ਕੋਰਸ": ["course", "training"],
  "ਸਿਖਲਾਈ": ["training", "course"], "ਡਾਟਾ": ["data"], "ਵਿਸ਼ਲੇਸ਼ਕ": ["analyst"], "ਇੰਜੀਨੀਅਰ": ["engineer"],
  "ਸਰਕਾਰੀ": ["government"], "ਪੁਣੇ": ["Pune"], "ਪੰਜਾਬ": ["Punjab"],
}));

function extractSearchTerms(message) {
  const terms = message.normalize("NFC").match(/[\p{L}\p{N}][\p{L}\p{M}\p{N}+#.-]*/gu) || [];
  return [...new Set(terms.map((term) => term.trim()).filter((term) => term.length > 1 && !STOP_WORDS.has(term.toLowerCase())))].slice(0, MAX_SEARCH_TERMS);
}

const JOB_INTENT = /\b(job|jobs|vacanc(?:y|ies)|employ(?:ment)?|work|career|salary|hiring|recruit|intern|fresher|opportunit(?:y|ies)|become|profession|role|path(?:way)?s?|skill gaps?|skills? required|what skills?)\b/i;
const COURSE_INTENT = /\b(course|courses|learn|training|certif(?:icate|ication)?|upskill|study|skill gap)\b/i;
const MULTILINGUAL_JOB_INTENT = /(नौकर|रोज़गार|रोजगार|काम|वेतन|तनख्वाह|करियर|भर्ती|अवसर|फ्रेशर|ਨੌਕਰੀ|ਰੁਜ਼ਗਾਰ|ਕੰਮ|ਤਨਖਾਹ|ਕਰੀਅਰ|ਭਰਤੀ|ਮੌਕੇ)/u;
const MULTILINGUAL_COURSE_INTENT = /(कोर्स|प्रशिक्षण|सीख|कौशल|हुनर|ਕੋਰਸ|ਸਿਖਲਾਈ|ਸਿੱਖ|ਹੁਨਰ)/u;
const ACKNOWLEDGEMENT = /^(thanks?|thank you|thx|ok(?:ay)?|got it|great|nice|cool)[.!\s]*$/i;

function isShortFollowUp(message) {
  return message.trim().split(/\s+/).length <= 6 && !ACKNOWLEDGEMENT.test(message.trim());
}

function buildSearchWhere(terms, skills = [], textFields = ["title", "description"]) {
  const clauses = [
    ...terms.flatMap((term) => textFields.map((field) => ({
      [field]: { contains: term, mode: "insensitive" },
    }))),
  ];
  const distinctSkills = [...new Set(skills.filter(Boolean))];
  if (distinctSkills.length) clauses.push({ skills: { hasSome: distinctSkills } });
  return clauses.length ? { OR: clauses } : {};
}

function skillSearchVariants(terms) {
  return [...new Set(terms.flatMap((term) => [
    term,
    term.toLowerCase(),
    term[0].toUpperCase() + term.slice(1).toLowerCase(),
    term.toUpperCase(),
  ]))];
}

function addSearchEquivalents(terms) {
  return [...new Set(terms.flatMap((term) => [term, ...(SEARCH_EQUIVALENTS.get(term) || [])]))].slice(0, MAX_SEARCH_TERMS * 3);
}

function validHttpUrl(value) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
  } catch {
    return null;
  }
}

function createChatContextService({ db = prisma } = {}) {
  async function retrieve({ message, userId, history = [] }) {
    const candidateProfile = userId
      ? await db.candidateProfile.findUnique({
        where: { userId },
        select: { education: true, skills: true, location: true, experienceYears: true },
      })
      : null;

    const recentHistory = history.slice(-6);
    const historyText = recentHistory.map((entry) => entry.content).join(" ");
    const rawTerms = [...new Set([
      ...extractSearchTerms(message),
      ...extractSearchTerms(recentHistory.slice().reverse().map((entry) => entry.content).join(" ")),
    ])].slice(0, MAX_SEARCH_TERMS);
    const terms = addSearchEquivalents(rawTerms);
    const candidateSkills = candidateProfile?.skills || [];
    const requestsJobsDirectly = JOB_INTENT.test(message) || MULTILINGUAL_JOB_INTENT.test(message);
    const requestsCoursesDirectly = COURSE_INTENT.test(message) || MULTILINGUAL_COURSE_INTENT.test(message);
    const employmentContext = JOB_INTENT.test(historyText) || MULTILINGUAL_JOB_INTENT.test(historyText) || /analytics|software development|data science|engineering|employment/i.test(historyText);
    const courseContext = COURSE_INTENT.test(historyText) || MULTILINGUAL_COURSE_INTENT.test(historyText);
    const followUp = isShortFollowUp(message);
    const requestsJobs = requestsJobsDirectly || (followUp && employmentContext) || (requestsCoursesDirectly && employmentContext);
    const requestsCourses = requestsCoursesDirectly || (followUp && courseContext);

    let jobs = [];
    if (requestsJobs) {
      const searchSkills = skillSearchVariants([...candidateSkills, ...terms]);
      const foundJobs = await db.job.findMany({
        where: buildSearchWhere(terms, searchSkills, ["title", "company", "location", "description", "employmentType"]),
        orderBy: { createdAt: "desc" },
        take: 24,
        select: {
          id: true,
          title: true,
          company: true,
          location: true,
          description: true,
          skills: true,
          employmentType: true,
          createdAt: true,
        },
      });
      const ranked = rankJobsForProfile(candidateProfile, foundJobs, MAX_JOB_RESULTS);
      const rankedIds = new Set(ranked.map(({ job }) => job.id));
      jobs = [
        ...ranked.map(({ job }) => job),
        ...foundJobs.filter((job) => !rankedIds.has(job.id)).slice(0, MAX_JOB_RESULTS - ranked.length),
      ];
    }

    const candidateSkillSet = new Set(candidateSkills.map((skill) => skill.toLowerCase()));
    const skillGaps = candidateProfile
      ? [...new Set(jobs.flatMap((job) => job.skills || []))]
        .filter((skill) => !candidateSkillSet.has(skill.toLowerCase()))
      : [];

    let courses = [];
    if (requestsCourses) {
      const courseTerms = [...new Set([...terms, ...(requestsJobs ? skillGaps : [])])].slice(0, MAX_SEARCH_TERMS);
      const foundCourses = await db.course.findMany({
        where: buildSearchWhere(courseTerms, skillSearchVariants([...courseTerms, ...candidateSkills]), ["title", "description", "provider"]),
        orderBy: { title: "asc" },
        take: MAX_COURSE_RESULTS,
        select: { id: true, title: true, provider: true, description: true, url: true, skills: true },
      });
      courses = foundCourses.map((course) => ({ ...course, url: validHttpUrl(course.url) }));
    }

    return {
      candidateProfile,
      jobs,
      courses,
      skillGaps,
      hasRelevantData: jobs.length > 0 || courses.length > 0,
      sources: [...new Set(courses.map((course) => course.url).filter(Boolean))],
    };
  }

  return { retrieve };
}

const chatContextService = createChatContextService();

module.exports = { createChatContextService, chatContextService, extractSearchTerms, buildSearchWhere, skillSearchVariants, addSearchEquivalents };
