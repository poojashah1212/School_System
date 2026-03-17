const express = require("express");
const router = express.Router();
console.log("Loading Material Routes...");
const jwtAuth = require("../middleware/auth");
const isTeacher = require("../middleware/isTeacher");

const {
    createMaterial,
    getTeacherMaterials,
    updateMaterial,
    deleteMaterial,
    getStudentMaterials
} = require("../controllers/teacher/materialController");

const upload = require("../middleware/materialUpload");
const { materialCreate, validate } = require("../middleware/validation/materialValidation");

// All routes here require authentication
router.use(jwtAuth);

// Teacher-only routes
router.post("/", isTeacher, upload.single("materialFile"), materialCreate, validate, createMaterial);
router.get("/", isTeacher, getTeacherMaterials); // Added default GET route
router.get("/teacher", isTeacher, getTeacherMaterials);
router.put("/:id", isTeacher, updateMaterial);
router.delete("/:id", isTeacher, deleteMaterial);

// Student access routes
router.get("/student/:classId", getStudentMaterials);

module.exports = router;
