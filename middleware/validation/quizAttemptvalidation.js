const Quiz = require("../../models/quiz");

exports.validateQuizAttempt = async (req, res, next) => {
  try {
    const { quizId } = req.params;
    const answers = req.body;

    // 1️⃣ answers must be array
    if (!Array.isArray(answers)) {
      return res.status(400).json({
        message: "Answers must be an array"
      });
    }

    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({
        message: "Quiz not found"
      });
    }

    // 2️⃣ answers length must match total questions
    if (answers.length !== quiz.questions.length) {
      return res.status(400).json({
        message: `You must submit exactly ${quiz.questions.length} answers`
      });
    }

    // 3️⃣ answers must be only A/B/C/D
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
