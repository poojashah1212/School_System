const express = require("express");
const router = express.Router();
const jwtAuth = require("../../middleware/auth");
const isTeacher = require("../../middleware/isTeacher");

const {
  getTodayClasses,
  createSession,
  getSessions,
  getActiveSessions,
  joinSession,
  endSession,
  markAttendance,
  getSessionStudents
} = require("../../controllers/teacher/liveSessionController");

// All routes require teacher authentication
router.use(jwtAuth, isTeacher);

// Today's timetable classes enriched with session status
router.get("/today-classes", getTodayClasses);

// Session CRUD
router.post("/create", createSession);
router.get("/sessions", getSessions);
router.get("/active", getActiveSessions);

// Session actions
router.get("/:id/join", joinSession);
router.patch("/:id/end", endSession);
router.post("/:id/attendance", markAttendance);
router.get("/:id/students", getSessionStudents);

module.exports = router;
