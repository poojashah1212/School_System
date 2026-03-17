const express = require("express");
const router = express.Router();
const timetableController = require("../controllers/admin/TimetableController");
const adminAuth = require("../middleware/adminAuth");

// Generate timetable for a single class
router.post("/generate", adminAuth, timetableController.generateTimetable);

// Generate timetables for all classes
router.post("/generate-all", adminAuth, timetableController.generateAllTimetables);

// Get timetable for a specific class
router.get("/:classId", adminAuth, timetableController.getClassTimetable);

// Get subjects for a class (for timetable editing)
router.get("/subjects/:classId", adminAuth, timetableController.getClassSubjects);

// Update timetable session
router.put("/session/:sessionId", adminAuth, timetableController.updateSession);

// Delete timetable session
router.delete("/session/:sessionId", adminAuth, timetableController.deleteSession);

module.exports = router;
