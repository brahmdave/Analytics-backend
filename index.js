require("dotenv").config();
const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const connectDB = require("./config/database");

// Import routes
const eventsRoutes = require("./routes/events");
const sessionRoutes = require("./routes/session");
const sitesRoutes = require("./routes/sites");
const authRoutes = require("./routes/auth");
const analyticsRoutes = require("./routes/analytics");
const heatmapRoutes = require("./routes/heatmap");

// Connect to MongoDB
connectDB();

const app = express();

// Middleware
// CORS configuration - allow all origins for analytics tracking
app.use(cors({
  origin: true, // Reflect the request origin (allows all origins)
  credentials: false, // Explicitly don't require credentials
  methods: ['GET', 'POST', 'OPTIONS', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: [],
  maxAge: 86400 // 24 hours
}));
app.use(express.json());

// Serve static files (tracker.js)
app.use(express.static("public"));

// Rate limiting for event ingestion (more lenient for batch ingestion)
const eventLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: "Too many requests, please try again later.",
});

// General rate limiting
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per 15 minutes
  message: "Too many requests, please try again later.",
});

// Routes
app.get("/", (req, res) => {
  res.send("Analytics backend running");
});

// API v1 routes
app.use("/api/v1/events", eventLimiter, eventsRoutes);
app.use("/api/v1/session", generalLimiter, sessionRoutes);
app.use("/api/v1/sites", generalLimiter, sitesRoutes);
app.use("/api/v1/auth", generalLimiter, authRoutes);
app.use("/api/v1/analytics", generalLimiter, analyticsRoutes);
app.use("/api/v1/heatmap", generalLimiter, heatmapRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(500).json({ error: "Internal server error" });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
