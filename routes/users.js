const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");
const upload = require("../middleware/upload"); 
const { studentUpdate } = require("../middleware/validation/userValidation"); 
const { updateStudent } = require("../controllers/teacherController"); 

const userController = require("../controllers/userController");
const { runValidation } = require("../middleware/validate");
const quizController = require("../controllers/quizController");
const { validateQuizAttempt } = require("../middleware/validation/quizAttemptvalidation");
 
router.use(auth);


router.get("/", userController.getAll);
router.get("/:id", userController.getOne);

router.put("/students/:userId", upload.single("image"), studentUpdate, runValidation, updateStudent);
router.get("/quiz/:id",quizController.getQuizForStudent);
router.post("/quiz/:quizId/submit", validateQuizAttempt, quizController.submitQuiz);
module.exports = router;
