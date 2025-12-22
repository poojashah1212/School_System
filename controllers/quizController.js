const Quiz = require("../models/quiz");
const User = require("../models/user");
const Marks = require("../models/marks"); // Import the new model

exports.createQuiz = async (req, res) => {
  try {
    const { title, class: className, subject, questions } = req.body;

    if (!title || !className || !subject || !questions?.length) {
      return res.status(400).json({ message: "All fields required" });
    }

    const quiz = await Quiz.create({
      title,
      class: className,
      subject,
      questions,
      totalMarks: questions.length,
      teacherId: req.user.id
    });

    res.status(201).json({
      message: "Quiz created successfully",
      quiz
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findOne({
      _id: req.params.id,
      teacherId: req.user.id
    });

    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }

    const { title, class: className, subject, questions } = req.body;

    if (title) quiz.title = title;
    if (className) quiz.class = className;
    if (subject) quiz.subject = subject;

    if (questions) {
      quiz.questions = questions;
      quiz.totalMarks = questions.length;
    }

    await quiz.save();

    res.json({
      message: "Quiz updated successfully",
      quiz
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


exports.updateSingleQuestion = async (req, res) => {
  try {
    const { quizId, index } = req.params;
    const { question, options, correctOption } = req.body;

    const quiz = await Quiz.findOne({
      _id: quizId,
      teacherId: req.user.id
    });

    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }

    if (!quiz.questions[index]) {
      return res.status(400).json({ message: "Invalid question index" });
    }

   
    quiz.questions[index].question = question;
    quiz.questions[index].options = options;
    quiz.questions[index].correctOption = correctOption;

    await quiz.save();

    return res.json({
      message: "Single question updated successfully",
      question: quiz.questions[index]
    });

  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.submitQuiz = async (req, res) => {
  try {
    const studentId = req.user.id;
    const answers = req.body;
    const quiz = req.quiz; // from validation middleware

    const student = await User.findById(studentId);
    if (!student || !student.teacherId) {
      return res.status(403).json({
        message: "Student not linked to teacher"
      });
    }

    // student–teacher security
    if (quiz.teacherId.toString() !== student.teacherId.toString()) {
      return res.status(403).json({
        message: "You cannot attempt another teacher's quiz"
      });
    }

    // prevent duplicate attempt
    const alreadyAttempted = await Marks.findOne({
      studentId,
      quizId: quiz._id
    });

    if (alreadyAttempted) {
      return res.status(400).json({
        message: "Quiz already attempted"
      });
    }

    let score = 0;
    quiz.questions.forEach((q, index) => {
      if (answers[index] === q.correctOption) {
        score++;
      }
    });

    const result = await Marks.create({
      studentId,
      quizId: quiz._id,
      teacherId: quiz.teacherId,
      score,
      totalMarks: quiz.questions.length
    });

    return res.status(201).json({
      message: "Quiz attempted successfully",
      data: result
    });

  } catch (err) {
    return res.status(500).json({
      message: err.message
    });
  }
};
