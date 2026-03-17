const express = require("express");
const router = express.Router();
const classSubjectController = require("../controllers/admin/classSubjectController");
const adminAuth = require("../middleware/adminAuth");

// Apply admin auth to all routes
router.use(adminAuth);

// Class Routes
router.get("/classes", classSubjectController.getClasses);
router.get("/seed", classSubjectController.seedClasses);
router.put("/classes/:id", classSubjectController.updateClass);
router.delete("/classes/:id", classSubjectController.deleteClass);

// Subject Routes (Global list and specific management)
router.get("/subjects", classSubjectController.getSubjects);
router.post("/classes/:classId/subjects", classSubjectController.addSubject);
router.put("/classes/:classId/subjects/:subjectId", classSubjectController.updateSubject);
router.delete("/classes/:classId/subjects/:subjectId", classSubjectController.deleteSubject);

module.exports = router;
