const Quiz = require("../../models/quiz");
const User = require("../../models/user");

exports.validateQuizAttempt = async (req, res, next) => {
  try {
    const { quizId } = req.params;
    const answers = req.body;
    const studentId = req.user.id;

    // 1️⃣ answers must be array
    if (!Array.isArray(answers)) {
      return res.status(400).json({
        message: "Answers must be an array"
      });
    }

    // 2️⃣ Get student and verify teacher assignment
    const student = await User.findById(studentId);
    if (!student || !student.teacherId) {
      return res.status(403).json({
        message: "Student not linked to any teacher"
      });
    }

    // 3️⃣ Get quiz and verify it exists
    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({
        message: "Quiz not found"
      });
    }

    // 4️⃣ CRITICAL: Verify student can only access their teacher's quiz
    if (quiz.teacherId.toString() !== student.teacherId.toString()) {
      return res.status(403).json({
        message: "You can only attempt quizzes from your assigned teacher"
      });
    }

    // 5️⃣ answers length must match total questions
    if (answers.length !== quiz.questions.length) {
      return res.status(400).json({
        message: `You must submit exactly ${quiz.questions.length} answers`
      });
    }

    // 6️⃣ answers must be only A/B/C/D
    const validOptions = ["A", "B", "C", "D"];
    for (let ans of answers) {
      if (!validOptions.includes(ans)) {
        return res.status(400).json({
          message: "Each answer must be one of A, B, C, D"
        });
      }
    }

    // pass quiz to controller (avoid re-fetch)
    req.quiz = quiz;

    next();

  } catch (err) {
    return res.status(500).json({
      message: err.message
    });
  }
};
