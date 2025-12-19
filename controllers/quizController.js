const Quiz = require("../models/quiz");
const fs = require("fs");

exports.uploadQuizCSV = async (req, res) => {
  const teacherId = req.user.id;
  const { title, class: className, subject } = req.body;

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
        title,
        class: className,
        subject,

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
        title,
        question: row.question || null,
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
  const teacherId = req.user.id;    
  const quizzes = await Quiz.find({ teacherId });
  res.json(quizzes);
};

exports.updateQuiz = async (req, res) => {
  const quizId = req.params.id;
  const teacherId = req.user.id;  
  const updateData = req.body;

  const quiz = await Quiz.findOne({ _id: quizId, teacherId });
  if (!quiz) {
    return res.status(404).json({ error: "Quiz not found" });
  } 
  Object.assign(quiz, updateData);
  await quiz.save();

  res.json({ message: "Quiz updated successfully", quiz });
};

