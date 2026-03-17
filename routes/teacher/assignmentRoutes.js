const express = require("express");
const router = express.Router();
const jwtAuth = require("../../middleware/auth");
const isTeacher = require("../../middleware/isTeacher");
const assignmentController = require("../../controllers/teacher/assignmentController");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Shared storage for assignments
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = "uploads/assignments";
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + "-" + file.originalname);
    }
});

const upload = multer({ storage });

// All teacher assignment routes require authentication and teacher role
router.use(jwtAuth);
router.use(isTeacher); // Apply isTeacher to all routes here

router.get("/submissions", assignmentController.getSubmissions);

// Specific evaluation route MUST come before generic ID routes
router.put("/:assignmentId/submissions/:submissionId/evaluate", (req, res, next) => {
    console.log("Hitting Evaluation Route:", req.params);
    next();
}, assignmentController.evaluateSubmission);

router.get("/", assignmentController.getAssignments);

router.post("/", (req, res, next) => {
    console.log("Hitting Create Assignment Route. Body before Multer:", req.body);
    console.log("Content-Type:", req.headers["content-type"]);
    next();
}, (req, res, next) => {
    upload.single("assignmentFile")(req, res, (err) => {
        if (err) {
            console.error("Multer Error in Route:", err);
            if (err instanceof multer.MulterError) {
                return res.status(400).json({ success: false, message: `Multer Error: ${err.message}`, code: err.code, field: err.field });
            }
            return res.status(500).json({ success: false, message: err.message });
        }
        next();
    });
}, assignmentController.createAssignment);

router.put("/:id",(req, res, next) => {
    console.log("Hitting Update Assignment Route:", req.params.id);
    next();
}, (req, res, next) => {
    upload.single("assignmentFile")(req, res, (err) => {
        if (err) {
            console.error("Multer Error in Update Route:", err);
            return res.status(400).json({ success: false, message: `Multer Error: ${err.message}` });
        }
        next();
    });
}, assignmentController.updateAssignment);

router.delete("/:id", assignmentController.deleteAssignment);

module.exports = router;
