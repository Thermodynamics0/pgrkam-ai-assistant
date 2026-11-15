/**
 * PGRKAM Database Seed Script
 * ============================
 * Populates the Job table with 40 realistic demonstration listings
 * across Punjab cities and multiple job categories.
 *
 * IMPORTANT – these are FICTIONAL DEMO listings.
 * They are NOT verified PGRKAM vacancies. Each description is prefixed
 * with "[DEMO]" and contains a unique fingerprint tag so the script can
 * skip records that already exist (idempotent – safe to run multiple times).
 *
 * Usage:
 *   node server/prisma/seed.js
 *
 * From the server/ directory:
 *   node prisma/seed.js
 */

"use strict";

require("dotenv").config({ path: require("path").join(__dirname, "../.env") });

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build a stable slug used as a uniqueness fingerprint inside descriptions. */
function slug(title, company, location) {
  return [title, company, location]
    .join("-")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .slice(0, 60);
}

/** Wrap a description with the DEMO prefix and a unique fingerprint tag. */
function demoDesc(description, title, company, location) {
  const fp = slug(title, company, location);
  return `[DEMO] ${description} [SEED:${fp}]`;
}

// ---------------------------------------------------------------------------
// 40 demonstration job listings across Punjab
// ---------------------------------------------------------------------------
// Schema fields used: title, company, location, description, skills[], employmentType
// ---------------------------------------------------------------------------

const DEMO_JOBS = [
  // ── Software Development (8) ──────────────────────────────────────────────
  {
    title: "Junior React Developer",
    company: "SoftNest Technologies",
    location: "Chandigarh",
    description: "Build and maintain React web applications for fintech clients. Work with REST APIs, component libraries and Git. Freshers with strong fundamentals are welcome.",
    skills: ["React", "JavaScript", "HTML", "CSS", "Git"],
    employmentType: "Full-time",
  },
  {
    title: "Node.js Backend Developer",
    company: "CodeBridge Solutions",
    location: "Mohali",
    description: "Develop RESTful APIs and microservices using Node.js and Express. Collaborate with frontend teams and maintain PostgreSQL databases.",
    skills: ["Node.js", "Express", "PostgreSQL", "REST APIs", "JavaScript"],
    employmentType: "Full-time",
  },
  {
    title: "Full Stack Developer",
    company: "TechNest Punjab",
    location: "Ludhiana",
    description: "Design, develop and deploy full-stack web applications using React and Node.js. 1–3 years experience preferred.",
    skills: ["React", "Node.js", "MongoDB", "JavaScript", "Git"],
    employmentType: "Full-time",
  },
  {
    title: "Python Developer",
    company: "DataWorks India",
    location: "Amritsar",
    description: "Write clean, efficient Python code for automation scripts, data pipelines and backend services. Experience with Django or Flask is a plus.",
    skills: ["Python", "Django", "Flask", "REST APIs", "SQL"],
    employmentType: "Full-time",
  },
  {
    title: "Mobile App Developer (Android)",
    company: "AppCraft Studios",
    location: "Jalandhar",
    description: "Develop and publish Android applications using Java and Kotlin. Experience with Firebase and Play Store deployment required.",
    skills: ["Android", "Java", "Kotlin", "Firebase", "Git"],
    employmentType: "Full-time",
  },
  {
    title: "DevOps Engineer",
    company: "CloudEdge Systems",
    location: "Chandigarh",
    description: "Manage CI/CD pipelines, cloud infrastructure and container orchestration. Experience with AWS, Docker and GitHub Actions required.",
    skills: ["AWS", "Docker", "Kubernetes", "CI/CD", "Linux"],
    employmentType: "Full-time",
  },
  {
    title: "PHP Laravel Developer",
    company: "WebCraft Punjab",
    location: "Patiala",
    description: "Build and maintain enterprise web applications using PHP and Laravel. Integrate payment gateways and third-party APIs.",
    skills: ["PHP", "Laravel", "MySQL", "JavaScript", "Git"],
    employmentType: "Full-time",
  },
  {
    title: "QA Test Engineer",
    company: "QualityFirst Tech",
    location: "Mohali",
    description: "Design and execute manual and automated test cases for web and mobile applications. Experience with Selenium or Cypress preferred.",
    skills: ["Selenium", "Cypress", "Manual Testing", "JIRA", "Python"],
    employmentType: "Full-time",
  },

  // ── Data Analytics (5) ───────────────────────────────────────────────────
  {
    title: "Data Analyst",
    company: "Punjab Data Labs",
    location: "Mohali",
    description: "Analyse large datasets, build dashboards in Power BI and present insights to business stakeholders. Proficiency in SQL and Excel required.",
    skills: ["SQL", "Power BI", "Excel", "Python", "Data Visualization"],
    employmentType: "Full-time",
  },
  {
    title: "Business Intelligence Analyst",
    company: "Insight Analytics Punjab",
    location: "Chandigarh",
    description: "Create BI reports and ETL pipelines to support strategic decisions. Experience with Tableau and data warehousing preferred.",
    skills: ["Tableau", "SQL", "ETL", "Excel", "Data Warehousing"],
    employmentType: "Full-time",
  },
  {
    title: "Data Analyst Trainee",
    company: "GrowMetrics",
    location: "Ludhiana",
    description: "Entry-level role to assist senior analysts with data cleaning, visualization and reporting. Fresh graduates with strong Excel and basic SQL skills welcome.",
    skills: ["Excel", "SQL", "Google Sheets", "Data Visualization"],
    employmentType: "Full-time",
  },
  {
    title: "Market Research Analyst",
    company: "PunjabBrands Consulting",
    location: "Amritsar",
    description: "Conduct primary and secondary market research, analyse consumer trends and prepare research reports for FMCG clients.",
    skills: ["Market Research", "Excel", "SPSS", "PowerPoint", "Statistics"],
    employmentType: "Full-time",
  },
  {
    title: "Data Operations Executive",
    company: "DataBridge Services",
    location: "Jalandhar",
    description: "Handle data entry, cleansing and quality checks for client datasets. Proficiency in Excel and attention to detail required.",
    skills: ["Excel", "Data Entry", "Data Quality", "SQL"],
    employmentType: "Full-time",
  },

  // ── AI / ML (4) ──────────────────────────────────────────────────────────
  {
    title: "Junior AI/ML Engineer",
    company: "AI Forge Punjab",
    location: "Chandigarh",
    description: "Develop and train machine learning models for NLP and computer vision use cases. Work with Python, TensorFlow and cloud ML platforms.",
    skills: ["Python", "TensorFlow", "Machine Learning", "NumPy", "Pandas"],
    employmentType: "Full-time",
  },
  {
    title: "Machine Learning Intern",
    company: "SmartTech Solutions",
    location: "Mohali",
    description: "6-month internship to assist the ML team with data preprocessing, model training and evaluation. Final-year students and fresh graduates welcome.",
    skills: ["Python", "Scikit-learn", "Pandas", "Jupyter", "Statistics"],
    employmentType: "Internship",
  },
  {
    title: "NLP Research Engineer",
    company: "LinguaAI Labs",
    location: "Chandigarh",
    description: "Research and implement NLP solutions for multilingual text classification and information extraction with focus on Hindi and Punjabi languages.",
    skills: ["Python", "NLP", "BERT", "Hugging Face", "PyTorch"],
    employmentType: "Full-time",
  },
  {
    title: "Computer Vision Engineer",
    company: "VisionTech Punjab",
    location: "Mohali",
    description: "Build real-time object detection and image classification solutions for industrial automation clients using OpenCV and deep learning.",
    skills: ["Python", "OpenCV", "TensorFlow", "Computer Vision", "Deep Learning"],
    employmentType: "Full-time",
  },

  // ── IT Support (3) ───────────────────────────────────────────────────────
  {
    title: "IT Support Engineer",
    company: "TechAssist Punjab",
    location: "Ludhiana",
    description: "Provide Level 1 and Level 2 IT support, manage hardware/software issues, configure networks and maintain IT inventory.",
    skills: ["Windows", "Networking", "Active Directory", "Hardware Troubleshooting"],
    employmentType: "Full-time",
  },
  {
    title: "Network Administrator",
    company: "NetPro Systems",
    location: "Amritsar",
    description: "Administer LAN/WAN networks, configure routers and switches, monitor network performance and ensure uptime for enterprise clients.",
    skills: ["Networking", "Cisco", "Firewalls", "Linux", "TCP/IP"],
    employmentType: "Full-time",
  },
  {
    title: "Help Desk Technician",
    company: "SupportFirst India",
    location: "Patiala",
    description: "Handle inbound IT support tickets, troubleshoot desktop and software issues and escalate to senior engineers when required.",
    skills: ["Windows", "Microsoft 365", "Ticketing Systems", "Customer Service"],
    employmentType: "Full-time",
  },

  // ── Digital Marketing (4) ────────────────────────────────────────────────
  {
    title: "Digital Marketing Executive",
    company: "BrandGrow Punjab",
    location: "Chandigarh",
    description: "Plan and execute SEO, SEM and social media campaigns. Manage Google Ads and Meta Ads budgets and analyse campaign performance.",
    skills: ["SEO", "Google Ads", "Meta Ads", "Content Marketing", "Analytics"],
    employmentType: "Full-time",
  },
  {
    title: "Social Media Manager",
    company: "PunjabMedia Co.",
    location: "Ludhiana",
    description: "Create, schedule and monitor content across Instagram, Facebook and LinkedIn. Engage with audiences and grow brand presence for local businesses.",
    skills: ["Social Media", "Content Creation", "Canva", "Analytics", "Copywriting"],
    employmentType: "Full-time",
  },
  {
    title: "SEO Specialist",
    company: "RankUp Digital",
    location: "Jalandhar",
    description: "Conduct keyword research, on-page and off-page SEO audits and implement link-building strategies to improve organic rankings.",
    skills: ["SEO", "Google Search Console", "Ahrefs", "Content Writing", "HTML"],
    employmentType: "Full-time",
  },
  {
    title: "Content Writer",
    company: "WordCraft Studios",
    location: "Amritsar",
    description: "Write SEO-optimised blog posts, website copy and social media content for clients in e-commerce, education and healthcare sectors.",
    skills: ["Content Writing", "SEO", "Copywriting", "Research", "MS Word"],
    employmentType: "Full-time",
  },

  // ── Sales (3) ────────────────────────────────────────────────────────────
  {
    title: "Sales Executive",
    company: "PunjabTrade Corp.",
    location: "Ludhiana",
    description: "Identify and onboard new B2B clients in the manufacturing and retail sectors. Meet monthly revenue targets and maintain client relationships.",
    skills: ["Sales", "CRM", "Negotiation", "Communication", "MS Excel"],
    employmentType: "Full-time",
  },
  {
    title: "Inside Sales Representative",
    company: "Leads360 India",
    location: "Chandigarh",
    description: "Make outbound calls, qualify inbound leads and close SaaS software subscriptions. Experience with CRM tools preferred.",
    skills: ["Inside Sales", "Cold Calling", "CRM", "Communication"],
    employmentType: "Full-time",
  },
  {
    title: "Field Sales Officer",
    company: "AgriMarket Punjab",
    location: "Bathinda",
    description: "Visit farm cooperatives and agri-input dealers across Bathinda district to promote company products. Two-wheeler required.",
    skills: ["Field Sales", "Communication", "Negotiation", "Punjabi", "MS Office"],
    employmentType: "Full-time",
  },

  // ── Banking & Finance (3) ────────────────────────────────────────────────
  {
    title: "Bank Probationary Officer (PO)",
    company: "Punjab Regional Bank",
    location: "Patiala",
    description: "Entry-level banking position covering branch operations, customer account management, loan processing and compliance. IBPS PO qualified candidates preferred.",
    skills: ["Banking Operations", "MS Office", "Customer Service", "Compliance", "Accounting"],
    employmentType: "Full-time",
  },
  {
    title: "Credit Analyst",
    company: "NorthFinance Ltd.",
    location: "Chandigarh",
    description: "Evaluate loan applications, assess creditworthiness of MSME and retail clients and prepare credit risk reports.",
    skills: ["Credit Analysis", "Financial Modeling", "Excel", "Risk Assessment", "Accounting"],
    employmentType: "Full-time",
  },
  {
    title: "Accounts Executive",
    company: "PunjabTax Advisors",
    location: "Jalandhar",
    description: "Maintain general ledger, prepare GST returns, reconcile bank statements and assist with monthly financial close.",
    skills: ["Tally ERP", "GST", "Accounting", "Excel", "Financial Reporting"],
    employmentType: "Full-time",
  },

  // ── Healthcare (3) ───────────────────────────────────────────────────────
  {
    title: "Medical Coder",
    company: "HealthPlus BPO",
    location: "Mohali",
    description: "Assign ICD-10 and CPT codes to medical records for US-based hospital clients. CPC certification or relevant training required.",
    skills: ["Medical Coding", "ICD-10", "CPT", "Anatomy", "MS Excel"],
    employmentType: "Full-time",
  },
  {
    title: "Hospital Administrator",
    company: "CityMed Hospital",
    location: "Amritsar",
    description: "Oversee daily hospital operations, manage staff schedules, coordinate with departments and ensure patient satisfaction standards.",
    skills: ["Healthcare Administration", "MS Office", "Leadership", "Communication", "Budgeting"],
    employmentType: "Full-time",
  },
  {
    title: "Pharmacist",
    company: "MediCare Pharmacy",
    location: "Ludhiana",
    description: "Dispense prescriptions, counsel patients on medication use, maintain inventory and ensure compliance with drug regulations.",
    skills: ["Pharmacy", "Drug Dispensing", "Patient Counseling", "Inventory Management"],
    employmentType: "Full-time",
  },

  // ── Civil Engineering (3) ────────────────────────────────────────────────
  {
    title: "Site Engineer",
    company: "BuildRight Infra",
    location: "Ludhiana",
    description: "Supervise construction activities, ensure adherence to drawings and specifications, manage labour and maintain daily site reports.",
    skills: ["Civil Engineering", "AutoCAD", "Site Supervision", "MS Project", "Surveying"],
    employmentType: "Full-time",
  },
  {
    title: "Structural Design Engineer",
    company: "PunjabBuilders Ltd.",
    location: "Chandigarh",
    description: "Design reinforced concrete and steel structures for residential and commercial projects using STAAD.Pro and AutoCAD.",
    skills: ["STAAD.Pro", "AutoCAD", "Structural Analysis", "RCC Design", "MS Excel"],
    employmentType: "Full-time",
  },
  {
    title: "Quality Control Inspector",
    company: "InfraCheck Services",
    location: "Patiala",
    description: "Inspect materials and workmanship at construction sites to ensure compliance with IS codes and project specifications.",
    skills: ["Quality Control", "Civil Engineering", "IS Codes", "Report Writing", "AutoCAD"],
    employmentType: "Full-time",
  },

  // ── Customer Support (3) ─────────────────────────────────────────────────
  {
    title: "Customer Support Executive",
    company: "ConnectCare BPO",
    location: "Mohali",
    description: "Handle inbound customer queries for a leading e-commerce platform via chat and email. Good written English and fast typing required.",
    skills: ["Customer Service", "CRM", "English", "Chat Support", "Problem Solving"],
    employmentType: "Full-time",
  },
  {
    title: "Voice Process Associate",
    company: "GlobalSupport India",
    location: "Chandigarh",
    description: "Manage inbound and outbound voice calls for US and UK clients. Night-shift allowance provided. Fluent spoken English required.",
    skills: ["English", "Communication", "Customer Service", "CRM"],
    employmentType: "Full-time",
  },
  {
    title: "Multilingual Support Agent (Punjabi/Hindi)",
    company: "RegionalHelp Desk",
    location: "Amritsar",
    description: "Provide customer support in Punjabi, Hindi and English for government scheme beneficiaries. Data entry skills required.",
    skills: ["Punjabi", "Hindi", "English", "Customer Service", "Data Entry"],
    employmentType: "Full-time",
  },

  // ── Manufacturing / Operations (3) ───────────────────────────────────────
  {
    title: "Production Supervisor",
    company: "Punjab Textiles Mill",
    location: "Ludhiana",
    description: "Supervise weaving and knitting production lines, ensure output targets are met, monitor quality and manage shift workers.",
    skills: ["Production Management", "Quality Control", "Leadership", "Inventory", "MS Excel"],
    employmentType: "Full-time",
  },
  {
    title: "Mechanical Maintenance Engineer",
    company: "AgriEquip Industries",
    location: "Bathinda",
    description: "Maintain and repair agricultural machinery and industrial equipment. Perform preventive maintenance and reduce equipment downtime.",
    skills: ["Mechanical Engineering", "Preventive Maintenance", "AutoCAD", "Hydraulics", "PLC"],
    employmentType: "Full-time",
  },
  {
    title: "Logistics Coordinator",
    company: "PunjabFreight Services",
    location: "Jalandhar",
    description: "Coordinate truck dispatches, vendor shipments and warehouse operations. Maintain delivery records and resolve logistics issues.",
    skills: ["Logistics", "MS Excel", "Inventory Management", "ERP", "Communication"],
    employmentType: "Full-time",
  },
];

// ---------------------------------------------------------------------------
// Seed function
// ---------------------------------------------------------------------------

async function main() {
  console.log("🌱  PGRKAM Database Seed — starting...\n");

  let inserted = 0;
  let skipped = 0;

  for (const job of DEMO_JOBS) {
    // Build the unique fingerprint for this record.
    const fp = slug(job.title, job.company, job.location);
    const fingerprintTag = `[SEED:${fp}]`;

    // Check whether this record already exists (idempotent).
    const existing = await prisma.job.findFirst({
      where: { description: { contains: fingerprintTag } },
    });

    if (existing) {
      console.log(`  ⏭  Skipped (already exists): ${job.title} @ ${job.company}`);
      skipped++;
      continue;
    }

    // Insert the new record.
    await prisma.job.create({
      data: {
        title: job.title,
        company: job.company,
        location: job.location,
        description: demoDesc(job.description, job.title, job.company, job.location),
        skills: job.skills,
        employmentType: job.employmentType,
      },
    });

    console.log(`  ✅  Inserted: ${job.title} @ ${job.company}, ${job.location}`);
    inserted++;
  }

  console.log(`\n────────────────────────────────────────`);
  console.log(`  ✅  Inserted : ${inserted} jobs`);
  console.log(`  ⏭  Skipped  : ${skipped} jobs (already existed)`);
  console.log(`  📋  Total    : ${DEMO_JOBS.length} records processed`);

  // Verify total jobs now in DB (all jobs, not just seeded ones).
  const totalInDb = await prisma.job.count();
  console.log(`  🗄️   DB total  : ${totalInDb} jobs in the Job table`);
  console.log(`────────────────────────────────────────\n`);
  console.log("🌱  Seed complete.\n");
}

main()
  .catch((err) => {
    console.error("❌  Seed failed:", err.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
