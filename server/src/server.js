
const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const app = express();
const frontendDist = path.resolve(__dirname, "../../frontend/dist");
const serveFrontend = process.env.NODE_ENV === "production" && fs.existsSync(frontendDist);

// Render terminates TLS in front of the app. Trust its single proxy hop so
// request IP rate limits apply to visitors instead of one shared proxy IP.
if (process.env.RENDER_EXTERNAL_URL) app.set("trust proxy", 1);

if (serveFrontend) {
    app.use(express.static(frontendDist, { index: false }));
}

// Allow the local Vite app and explicitly configured production origins.
const configuredOrigins = (process.env.CORS_ORIGIN || "http://localhost:5173,http://127.0.0.1:5173")
    .split(",").map((origin) => origin.trim()).filter(Boolean);
if (process.env.RENDER_EXTERNAL_URL) configuredOrigins.push(process.env.RENDER_EXTERNAL_URL);
app.use(cors({ origin(origin, callback) {
    if (!origin || configuredOrigins.includes(origin)) return callback(null, true);
    return callback(new Error("Origin is not allowed by CORS"));
} }));
app.use(express.json({ limit: "1mb" }));

// Health check
app.get("/health", (req, res) => {
    res.status(200).json({
        success: true,
        message: "PGRKAM AI Assistant API is running!",
    });
});

const jobRoutes = require("./routes/job.routes");
const authRoutes = require("./routes/auth.routes");
const profileRoutes = require("./routes/profile.routes");
const courseRoutes = require("./routes/course.routes");
const chatRoutes = require("./routes/chat.routes");
const recommendationRoutes = require("./routes/recommendation.routes");
const chatRequestErrorHandler = require("./middleware/chat-request-error.middleware");

app.use("/api/jobs", jobRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/recommendations", recommendationRoutes);

// In production, serve the built React app from this same origin as the API.
// API paths are excluded so backend errors never turn into HTML responses.
if (serveFrontend) {
    app.get(/^\/(?!api(?:\/|$)).*/, (_req, res) => {
        res.sendFile(path.join(frontendDist, "index.html"));
    });
} else {
    // Preserve the local backend root health response during development.
    app.get("/", (_req, res) => {
        res.status(200).json({ success: true, message: "PGRKAM AI Assistant API is running!" });
    });
}

// Keep malformed and oversized chat JSON errors in the chat API contract.
app.use(chatRequestErrorHandler);

app.use((error, req, res, next) => {
    if (res.headersSent) return next(error);
    console.error("Request failed:", error?.name || "UnexpectedError");
    return res.status(500).json({ success: false, code: "INTERNAL_ERROR", message: "The request could not be completed." });
});

// Server
const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
