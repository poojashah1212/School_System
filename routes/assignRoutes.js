const express = require("express");
const router = express.Router();
const assignController = require("../controllers/admin/AssignClassSubjectController");
const adminAuth = require("../middleware/adminAuth");

// All assignment routes require admin authentication
router.use(adminAuth);

router.get("/classes", assignController.getAssignments);
router.post("/assign", assignController.assignClass);
router.post("/unassign", assignController.unassignClass);

// Subject assignment routes
router.get("/subjects", assignController.getSubjectAssignments);
router.post("/assign-subject", assignController.assignSubject);
router.post("/unassign-subject", assignController.unassignSubject);

module.exports = router;
