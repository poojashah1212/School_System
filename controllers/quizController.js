const Quiz = require("../models/quiz");
const fs = require("fs");

exports.uploadQuizCSV = async (req, res) => {
  const teacherId = req.user.id;

  let inserted = 0;
  let skipped = req.csvSkippedDetails.length;
  const results = [...req.csvSkippedDetails];

  for (let i = 0; i < req.csvRows.length; i++) {
    const row = req.csvRows[i];

    const alreadyInvalid = req.csvSkippedDetails.find(
      r => r.row === i + 2
    );
    if (alreadyInvalid) continue;

    try {
      await Quiz.create({
        question: row.question,
        optionA: row.optionA,
        optionB: row.optionB,
        optionC: row.optionC,
        optionD: row.optionD,
        correctOption: row.correctOption,
        marks: row.marks,
        teacherId
      });

      inserted++;
    } catch (err) {
      skipped++;
      results.push({
        row: i + 2,
        question: row.question,
        reasons: ["Database error"]
      });
    }
  }

  fs.unlinkSync(req.file.path);

  res.json({
    message: "Quiz CSV upload completed",
    total: req.csvRows.length,
    inserted,
    skipped,
    skippedDetails: results
  });
};

exports.getMyQuizzes = async (req, res) => {
  try {
    const teacherId = req.user.id;

    const quizzes = await Quiz.find({ teacherId })
      .sort({ createdAt: -1 });

    res.json({
      total: quizzes.length,
      quizzes
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.updateQuiz = async (req, res) => {
  try {
    const quizId = req.params.id;
    const teacherId = req.user.id;

    const quiz = await Quiz.findOneAndUpdate(
      { _id: quizId, teacherId },
      req.body,
      { new: true }
    );

    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }

    res.json({
      message: "Quiz updated successfully",
      quiz
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};
