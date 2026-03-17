const express = require("express");
const router = express.Router();
const academicYearController = require("../controllers/admin/AcademicYearController");
const adminAuth = require("../middleware/adminAuth");
const authMiddleware = require("../middleware/authMiddleware");
const uploadCsv = require("../middleware/uploadCsv");

// View events - available to all authenticated users (teachers, students, admin)
router.get("/events", authMiddleware, academicYearController.getEvents);

// Admin-only routes
router.post("/upload-csv", adminAuth, uploadCsv.single("file"), academicYearController.uploadCSV);
router.delete("/clear", adminAuth, academicYearController.clearEvents);
router.get("/download-sample", adminAuth, academicYearController.downloadSample);

module.exports = router;
