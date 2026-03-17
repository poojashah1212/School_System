const express = require("express");
const router = express.Router();
const jwtAuth = require("../../middleware/auth");
const isTeacher = require("../../middleware/isTeacher");

const {
  getAssignedClasses,
  getClassStudents,
  getAllAssignedStudents,
  getClassTimetable,
  getAllTimetables
} = require("../../controllers/teacher/teacherassigned");

const {
  createAnnouncement,
  getAnnouncements,
  deleteAnnouncement
} = require("../../controllers/admin/AnnouncementController");

// All routes here require teacher authentication
router.use(jwtAuth, isTeacher);

router.get("/assigned-classes", getAssignedClasses);
router.get("/assigned-students", getAllAssignedStudents);
router.get("/assigned-classes/:classId/students", getClassStudents);
router.get("/assigned-classes/:classId/timetable", getClassTimetable);
router.get("/all-timetables", getAllTimetables);

// Announcement routes for teachers
router.post("/announcements", createAnnouncement);
router.get("/announcements", getAnnouncements);
router.delete("/announcements/:id", deleteAnnouncement);

module.exports = router;
