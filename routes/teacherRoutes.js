const express = require("express");
const router = express.Router();

const jwtAuth = require("../middleware/auth");
const isTeacher = require("../middleware/isTeacher");
const upload = require("../middleware/upload"); 
const uploadCsv = require("../middleware/uploadCsv"); 
const authMiddleware = require("../middleware/authMiddleware");
const { createQuizValidation } = require("../middleware/validation/quizValidation");
const { createQuiz, updateQuiz, updateSingleQuestion, getQuizzes, deleteQuiz, getQuizById, uploadQuizCsv } = require("../controllers/teacher/quizController");
const { quizSingleQuestionValidation } = require("../middleware/validation/quizValidation");
const { quizCsvUploadValidation } = require("../middleware/validation/quizCsvValidation");

const {
  studentCreate,
  studentIdParam,
  studentUpdate,
  csvUploadValidation
} = require("../middleware/validation/userValidation");

const { runValidation } = require("../middleware/validate");

const {
  createStudent,
  getStudentById,
  getMyStudents,
  updateStudent,
  deleteStudent,
  uploadStudentsCSV,
  getTeacherProfile,
  updateTeacherProfile
} = require("../controllers/teacher/teacherController");

const {
  createAnnouncement,
  getAnnouncements,
  deleteAnnouncement
} = require("../controllers/admin/AnnouncementController");

router.use(jwtAuth, isTeacher);

// Announcement routes for teachers
router.post("/announcements", createAnnouncement);
router.get("/announcements", getAnnouncements);
router.delete("/announcements/:id", deleteAnnouncement);

router.put(
  "/quiz/:quizId/question/:index",
  quizSingleQuestionValidation,
  updateSingleQuestion
);



router.post(
  "/students",
  authMiddleware,
  upload.single("image"),     
  studentCreate,
  runValidation,
  createStudent
);

router.get("/students", getMyStudents);

router.get(
  "/students/:userId",
  studentIdParam,
  runValidation,
  getStudentById
);

router.put(
  "/students/update/:userId",
  upload.single("image"),    
  studentUpdate,
  runValidation,
  updateStudent
);
router.delete("/students/:userId", deleteStudent);

router.post(
  "/students/upload-csv",
  uploadCsv.single("file"), 
  csvUploadValidation, 
  uploadStudentsCSV
);

router.post("/quiz", createQuizValidation, runValidation, createQuiz);

router.post(
  "/quiz/upload-csv",
  uploadCsv.single("file"),
  quizCsvUploadValidation,
  uploadQuizCsv
);

router.get("/quiz", getQuizzes);

router.get("/quiz/:id", getQuizById);

router.delete("/quiz/:id", deleteQuiz);

router.put(
  "/quiz/:id",
  createQuizValidation,
  runValidation,
  updateQuiz
);

// Teacher Profile routes
router.get("/profile", getTeacherProfile);
router.put("/profile", upload.single("profileImage"), updateTeacherProfile);

module.exports = router;
