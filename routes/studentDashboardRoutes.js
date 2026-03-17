const express = require("express");
const router = express.Router();
const studentDashboardController = require("../controllers/student/studentDashboardController");
const jwtAuth = require("../middleware/auth");
const roleAuth = require("../middleware/roleAuth");

// All routes here require student authentication
router.use(jwtAuth, roleAuth("student"));

// Get student's class timetable
router.get("/timetable", studentDashboardController.getTimetable);

// Get student's class study materials
router.get("/materials", studentDashboardController.getMaterials);

module.exports = router;
