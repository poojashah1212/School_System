const Quiz = require("../models/quiz");
const User = require("../models/user");
const Marks = require("../models/marks"); // Import the new model

exports.getQuizzes = async (req, res) => {
  try {
    const teacherId = req.user.id;
    
    const quizzes = await Quiz.find({ teacherId })
      .sort({ createdAt: -1 });
    
    res.json({ quizzes });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createQuiz = async (req, res) => {
  try {
    const { title, class: className, subject, questions, totalMarks } = req.body;

    if (!title || !className || !subject || !questions?.length || !totalMarks) {
      return res.status(400).json({ message: "All fields required" });
    }

    const quiz = await Quiz.create({
      title,
      class: className,
      subject,
      questions,
      totalMarks,
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

    const { title, class: className, subject, questions, totalMarks } = req.body;

    if (title) quiz.title = title;
    if (className) quiz.class = className;
    if (subject) quiz.subject = subject;

    if (questions) {
      quiz.questions = questions;
    }
    
    if (totalMarks !== undefined) {
      quiz.totalMarks = totalMarks;
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
    const quiz = req.quiz;

    const student = await User.findById(studentId);
    if (!student || !student.teacherId) {
      return res.status(403).json({
        message: "Student not linked to teacher"
      });
    }

    
    if (quiz.teacherId.toString() !== student.teacherId.toString()) {
      return res.status(403).json({
        message: "You cannot attempt another teacher's quiz"
      });
    }


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
      totalMarks: quiz.totalMarks
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
exports.deleteQuiz = async (req, res) => {
  try {
    const quizId = req.params.id;
    const teacherId = req.user.id;
    
    const quiz = await Quiz.findOneAndDelete({
      _id: quizId,
      teacherId: teacherId
    });
    
    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }
    
    res.json({ message: "Quiz deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getQuizForStudent = async (req, res) => {
  try {
    const quizId = req.params.id;
    const studentId = req.user.id;

    // Get student and verify teacher assignment
    const student = await User.findById(studentId);
    if (!student || !student.teacherId) {
      return res.status(403).json({ 
        message: "Student not linked to any teacher" 
      });
    }

    // Get quiz and verify it exists
    const quiz = await Quiz.findById(quizId).select('-questions.correctOption');
    if (!quiz) {
      return res.status(404).json({ 
        message: "Quiz not found" 
      });
    }

    // CRITICAL: Verify student can only access their teacher's quiz
    if (quiz.teacherId.toString() !== student.teacherId.toString()) {
      return res.status(403).json({ 
        message: "You can only access quizzes from your assigned teacher" 
      });
    }

    res.json({ quiz }); 
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getQuizById = async (req, res) => {
  try {
    const quizId = req.params.id;
    const teacherId = req.user.id;
    
    const quiz = await Quiz.findOne({
      _id: quizId,
      teacherId: teacherId
    });
    
    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }
    
    res.json({ quiz });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getAvailableQuizzesForStudent = async (req, res) => {
  try {
    const student = await User.findById(req.user.id);
    if (!student || !student.teacherId) {
      return res.status(403).json({ message: "Student not linked to teacher" });
    }

    const quizzes = await Quiz.find({ 
      teacherId: student.teacherId,
      class: student.class 
    }).select('-questions.correctOption').sort({ createdAt: -1 });

    // Get attempted quiz IDs
    const attemptedQuizzes = await Marks.find({ 
      studentId: req.user.id 
    }).distinct('quizId');

    // Filter out already attempted quizzes
    const availableQuizzes = quizzes.filter(quiz => 
      !attemptedQuizzes.includes(quiz._id.toString())
    );

    res.json({ quizzes: availableQuizzes });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getStudentResults = async (req, res) => {
  try {
    const results = await Marks.find({ 
      studentId: req.user.id 
    })
    .populate('quizId', 'title subject')
    .sort({ createdAt: -1 });

    res.json({ results });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};