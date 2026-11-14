
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get("/", (req, res) => {
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

// Keep malformed and oversized chat JSON errors in the chat API contract.
app.use(chatRequestErrorHandler);

// Server
const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
