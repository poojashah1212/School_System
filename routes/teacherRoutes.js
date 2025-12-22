const express = require("express");
const router = express.Router();

const jwtAuth = require("../middleware/auth");
const isTeacher = require("../middleware/isTeacher");
const upload = require("../middleware/upload"); 
const uploadCsv = require("../middleware/uploadCsv"); 
const authMiddleware = require("../middleware/authMiddleware");
const { createQuizValidation } = require("../middleware/validation/quizValidation");
const { createQuiz } = require("../controllers/quizController");
const { updateQuiz } = require("../controllers/quizController");
const { updateSingleQuestion } = require("../controllers/quizController");
const { quizSingleQuestionValidation } = require("../middleware/validation/quizValidation");

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
  uploadStudentsCSV
} = require("../controllers/teacherController");

router.use(jwtAuth, isTeacher);

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
router.post("/quiz", createQuizValidation, createQuiz);

router.put(
  "/quiz/:id",
  createQuizValidation,
  updateQuiz
);

module.exports = router;
