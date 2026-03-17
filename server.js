require("dotenv").config();
const express = require("express");
const path = require("path");
const cors = require("cors");
const connectDB = require("./config/db");
const { connectRedis } = require("./config/redis");
const classSubjectController = require("./controllers/admin/classSubjectController");
const app = express();

// Enable CORS for all routes
app.use(cors({
  origin: ['http://localhost:5001', 'https://smartschool-je18.onrender.com'],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Static files - order matters
app.use(express.static(path.join(__dirname, "frontend")));

// Landing page CSS/JS/Images (serve at root for landing pages)
app.use('/css', express.static(path.join(__dirname, "landing", "css"), { fallthrough: false }));
app.use('/js', express.static(path.join(__dirname, "landing", "js"), { fallthrough: false }));
app.use('/images', express.static(path.join(__dirname, "landing", "images"), { fallthrough: false }));

// Landing pages route handler (must be after static files)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, "landing", "index.html"));
});

app.get('/student-admission', (req, res) => {
  res.sendFile(path.join(__dirname, "landing", "student-admission.html"));
});

app.get('/job-application', (req, res) => {
  res.sendFile(path.join(__dirname, "landing", "job-application.html"));
});

connectDB().then(() => {
  classSubjectController.autoSeedClasses();
});
connectRedis();

console.log(">>> [SERVER] Registering Student Dashboard Routes...");
app.use("/api/student", require("./routes/studentDashboardRoutes"));
app.use("/api/student", require("./routes/student/liveSessionRoutes"));
app.use("/api/auth", require("./routes/auth"));
app.use("/api/users", require("./routes/users"));
app.use("/api/admin", require("./routes/admin"));
app.use("/api/teacher/assignments", require("./routes/teacher/assignmentRoutes"));
app.use("/api/materials", require("./routes/materialRoutes"));
app.use("/api/teachers/view", require("./routes/teacher/teacher"));
app.use("/api/teacher", require("./routes/teacher/teacher")); 
app.use("/api/teachers", require("./routes/teacherRoutes"));

app.use("/api/teacher-availability", require("./routes/teacherAvailabilityRoutes"));
app.use("/api/sessions", require("./routes/sessionRoutes"));
app.use("/api/quizzes", require("./routes/quizRoutes"));
app.use("/api/applications", require("./routes/applicationRoutes"));
app.use("/api/academic", require("./routes/classSubjectRoutes"));
app.use("/api/assign", require("./routes/assignRoutes"));
app.use("/api/academic-year", require("./routes/academicYearRoutes"));
app.use("/api/timetable", require("./routes/timetableRoutes"));
app.use("/api/fees", require("./routes/feesRoutes"));
app.use("/api/live-session", require("./routes/teacher/liveSessionRoutes"));
app.get("/api/test-student", (req, res) => {
    console.log(">>> [SERVER] Diagnostic route hit!");
    res.json({ success: true, message: "Student API registration is reachable" });
});

console.log("Registered routes:");
console.log("- /api/assign/subjects");
console.log("- /api/assign/assign-subject");
console.log("- /api/assign/unassign-subject");

// Fallback route for frontend - serve appropriate HTML file for non-API routes
app.use((req, res, next) => {
  if (req.path.startsWith("/api")) {
    return next();
  }

  // Handle specific HTML pages (existing system routes)
  const htmlPages = ['/login', '/signup', '/studentDashboard'];
  const pagePath = htmlPages.find(page => req.path.includes(page));

  if (pagePath) {
    if (pagePath === '/studentDashboard') {
      return res.sendFile(path.join(__dirname, "frontend", "student", "html", "student-dashboard.html"));
    }
    const fileName = pagePath.substring(1);
    return res.sendFile(path.join(__dirname, "frontend", "html", `${fileName}.html`));
  }

  // Handle teacher dashboard route
  if (req.path.includes('/teacherDashboard')) {
    return res.sendFile(path.join(__dirname, "frontend", "teacher", "html", "teacher-dashboard.html"));
  }

  // Handle admin routes
  if (req.path.includes('/admin')) {
    if (req.path === '/admin' || req.path === '/admin/') {
      return res.sendFile(path.join(__dirname, "frontend", "admin", "html", "admin-dashboard.html"));
    }
    if (req.path === '/admin/html/admin-dashboard.html') {
      return res.sendFile(path.join(__dirname, "frontend", "admin", "html", "admin-dashboard.html"));
    }
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
// Global error handling middleware
app.use((err, req, res, next) => {
  console.error("Unhandled Error:", err);

  // Handle Multer Errors
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        success: false,
        message: "File too large. Maximum size allowed is 200MB."
      });
    }
    return res.status(400).json({
      success: false,
      message: `Upload error: ${err.message}`
    });
  }

  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined
  });
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log("Server running at http://localhost:" + PORT);
});

