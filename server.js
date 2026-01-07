require("dotenv").config();
const express = require("express");
const path = require("path");
const cors = require("cors");
const connectDB = require("./config/db");
const { connectRedis } = require("./config/redis");
const app = express();

// Enable CORS for all routes
app.use(cors({
  origin: ['http://localhost:5001', 'http://127.0.0.1:5001'],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use(express.static(path.join(__dirname, "frontend")));

connectDB();
connectRedis();

app.use("/api/auth", require("./routes/auth"));
app.use("/api/users", require("./routes/users"));
app.use("/api/teachers", require("./routes/teacherRoutes"));
app.use("/api/teacher-availability", require("./routes/teacherAvailabilityRoutes"));
app.use("/api/sessions", require("./routes/sessionRoutes"));

// Fallback route for frontend - serve appropriate HTML file for non-API routes
app.use((req, res, next) => {
  if (req.path.startsWith("/api")) {
    return next();
  }
  
  // Handle specific HTML pages
  const htmlPages = ['/login', '/signup', '/teacherDashboard', '/studentDashboard'];
  const pagePath = htmlPages.find(page => req.path.includes(page));
  
  if (pagePath) {
    const fileName = pagePath === '/' ? 'index' : pagePath.substring(1);
    return res.sendFile(path.join(__dirname, "frontend", "html", `${fileName}.html`));
  }
  
  // Default to index.html for other routes
  res.sendFile(path.join(__dirname, "frontend", "html", "index.html"));
});

// 404 handler for API routes
app.use((req, res) => {
  res.status(404).json({
    message: "Route not found",
    path: req.originalUrl,
    method: req.method
  });
});
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log("Server running at http://localhost:" + PORT);
});
