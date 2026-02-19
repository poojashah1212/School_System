const express = require("express");
const jwtAuth = require("../middleware/auth");
const roleAuth = require("../middleware/roleAuth");
const {
  getQuizzes,
  createQuiz,
  updateQuiz,
  deleteQuiz,
  getQuizById,
  getQuizAttemptTracking,
  getQuizForStudent,
  submitQuiz,
  getAvailableQuizzesForStudent,
  getStudentResults,
  getSpecificQuizResult,
  updateSingleQuestion,
  uploadQuizCsv,
  checkQuizAttemptStatus
} = require("../controllers/quizController");

const router = express.Router();

// Test route to verify routes are loaded
router.get("/test", (req, res) => {
    res.json({ message: "Quiz routes are working!" });
});

// Teacher routes
router.get("/", jwtAuth, roleAuth("teacher"), getQuizzes);
router.post("/", jwtAuth, roleAuth("teacher"), createQuiz);
router.post("/upload-csv", jwtAuth, roleAuth("teacher"), uploadQuizCsv);

//router.get("/attempt-tracking/:id", jwtAuth, roleAuth("teacher"), getQuizAttemptTracking);//
router.get("/:id/attempt-tracking", jwtAuth, roleAuth("teacher"), getQuizAttemptTracking);
router.get("/:id", jwtAuth, roleAuth("teacher"), getQuizById);
router.put("/:id", jwtAuth, roleAuth("teacher"), updateQuiz);
router.delete("/:id", jwtAuth, roleAuth("teacher"), deleteQuiz);
router.put("/:id/questions/:index", jwtAuth, roleAuth("teacher"), updateSingleQuestion);

// Student routes
router.get("/student/quizzes", jwtAuth, roleAuth("student"), getAvailableQuizzesForStudent);
router.get("/student/:id", jwtAuth, roleAuth("student"), getQuizForStudent);
router.get("/student/:id/attempt-status", jwtAuth, roleAuth("student"), checkQuizAttemptStatus);
router.get("/student/:id/results", jwtAuth, roleAuth("student"), getSpecificQuizResult);
router.post("/student/:id/submit", jwtAuth, roleAuth("student"), submitQuiz);
router.get("/student/results", jwtAuth, roleAuth("student"), getStudentResults);

module.exports = router;
