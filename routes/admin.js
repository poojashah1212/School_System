const express = require("express");
const router = express.Router();

const adminController = require("../controllers/admin/adminController");
const adminAuth = require("../middleware/adminAuth");
const auth = require("../middleware/auth");
const {
    createAnnouncement,
    getAnnouncements,
    deleteAnnouncement
} = require("../controllers/admin/AnnouncementController");

router.get("/teachers", adminAuth, adminController.getTeachers);
router.put("/teachers/:id", adminAuth, adminController.updateTeacher);
router.delete("/teachers/:id", adminAuth, adminController.deleteTeacher);

router.get("/test", (req, res) => res.send("OK"));

// Student Management Routes
router.get("/student-list", adminAuth, adminController.getStudents);
router.put("/student-list/:id", adminAuth, adminController.updateStudent);
router.delete("/student-list/:id", adminAuth, adminController.deleteStudent);

// Announcement Routes
router.post("/announcements", adminAuth, createAnnouncement);
router.get("/announcements", auth, getAnnouncements);
router.delete("/announcements/:id", adminAuth, deleteAnnouncement);

module.exports = router;
