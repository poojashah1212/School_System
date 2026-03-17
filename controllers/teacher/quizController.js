const mongoose = require("mongoose");
const Quiz = require("../../models/quiz");
const User = require("../../models/user");
const Marks = require("../../models/marks");

exports.getQuizzes = async (req, res) => {
  try {
    const teacherId = req.user.id;
    const { status } = req.query;

    const query = { teacherId };
    if (status && ['draft', 'published'].includes(status)) {
      query.status = status;
    }

    const quizzes = await Quiz.find(query)
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      quizzes
    });
  } catch (err) {
    res.status(500).json({ 
      success: false,
      message: err.message 
    });
  }
};

exports.createQuiz = async (req, res) => {
  try {
    const { title, class: className, subject, questions, totalMarks, startTime, endTime, duration, status } = req.body;

    // Calculate totalMarks from number of questions if not provided
    const calculatedTotalMarks = totalMarks || questions?.length || 0;

    const quiz = await Quiz.create({
      title,
      class: className || '',
      subject: subject || '',
      questions: questions || [],
      totalMarks: calculatedTotalMarks,
      startTime: status === 'draft' ? null : new Date(startTime),
      endTime: status === 'draft' ? null : new Date(endTime),
      duration: status === 'draft' ? null : parseInt(duration) || null,
      status: status || 'published',
      teacherId: req.user.id
    });

    const message = status === 'draft' ? 
      "Quiz saved as draft successfully" : 
      "Quiz created successfully";

    res.status(201).json({
      success: true,
      message,
      quiz
    });

  } catch (err) {
    res.status(500).json({ 
      success: false,
      message: err.message 
    });
  }
};

exports.updateQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findOne({
      _id: req.params.id,
      teacherId: req.user.id
    });

    if (!quiz) {
      return res.status(404).json({ 
        success: false,
        message: "Quiz not found" 
      });
    }

    const { title, class: className, subject, questions, totalMarks, startTime, endTime, duration, status } = req.body;

    if (title) quiz.title = title;
    if (className) quiz.class = className;
    if (subject) quiz.subject = subject;
    if (questions) quiz.questions = questions;
    if (totalMarks !== undefined) quiz.totalMarks = totalMarks;
    if (startTime) quiz.startTime = new Date(startTime);
    if (endTime) quiz.endTime = new Date(endTime);
    if (duration !== undefined) quiz.duration = parseInt(duration);
    if (status !== undefined) quiz.status = status;

    await quiz.save();

    res.json({
      success: true,
      message: "Quiz updated successfully",
      quiz
    });

  } catch (err) {
    res.status(500).json({ 
      success: false,
      message: err.message 
    });
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

    quiz.questions[index].question = question;
    quiz.questions[index].options = options;
    quiz.questions[index].correctOption = correctOption;

    await quiz.save();

    return res.json({
      success: true,
      message: "Single question updated successfully",
      question: quiz.questions[index]
    });

  } catch (error) {
    return res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

exports.submitQuiz = async (req, res) => {
  try {
    const { quizId, studentId, answers, timeTaken } = req.body;
    
    // Validate required fields
    if (!quizId || !studentId || !answers) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: quizId, studentId, or answers"
      });
    }

    // Get quiz details
    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: "Quiz not found"
      });
    }

    // Get student details
    const student = await User.findById(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found"
      });
    }

    // Verify student can attempt this quiz
    if (quiz.teacherId.toString() !== student.teacherId.toString()) {
      return res.status(403).json({
        success: false,
        message: "You can only attempt quizzes from your assigned teacher"
      });
    }

    // Check if already attempted
    const alreadyAttempted = await Marks.findOne({
      studentId,
      quizId: quiz._id
    });

    if (alreadyAttempted) {
      return res.status(409).json({
        success: false,
        message: "You have already submitted this quiz"
      });
    }

    // Calculate score
    let correctAnswers = 0;
    quiz.questions.forEach((question, index) => {
      const userAnswer = answers[index];
      const correctOption = question.correctOption;
      
      // Handle both string (A, B, C, D) and number (0, 1, 2, 3) formats
      let isCorrect = false;
      if (typeof userAnswer === 'number' && typeof correctOption === 'number') {
        isCorrect = userAnswer === correctOption;
      } else if (typeof userAnswer === 'number' && typeof correctOption === 'string') {
        isCorrect = String.fromCharCode(65 + userAnswer) === correctOption;
      } else if (typeof userAnswer === 'string' && typeof correctOption === 'number') {
        isCorrect = userAnswer === String.fromCharCode(65 + correctOption);
      } else {
        isCorrect = userAnswer === correctOption;
      }
      
      if (isCorrect) correctAnswers++;
    });

    const totalQuestions = quiz.questions.length;
    const scorePercentage = Math.round((correctAnswers / totalQuestions) * 100);

    // Save results
    await Marks.create({
      studentId,
      quizId: quiz._id,
      teacherId: quiz.teacherId,
      score: correctAnswers,
      totalMarks: quiz.totalMarks || totalQuestions,
      percentage: scorePercentage,
      timeTaken,
      submittedAt: new Date()
    });

    res.status(201).json({
      success: true,
      message: "Quiz submitted successfully!",
      data: {
        totalQuestions,
        correctAnswers,
        wrongAnswers: totalQuestions - correctAnswers,
        scorePercentage,
        status: scorePercentage >= 50 ? 'Pass' : 'Fail'
      }
    });

  } catch (err) {
    console.error('Quiz submission error:', err);
    res.status(500).json({
      success: false,
      message: "Failed to submit quiz"
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

    res.json({ 
      success: true,
      message: "Quiz deleted successfully" 
    });
  } catch (err) {
    res.status(500).json({ 
      success: false,
      message: err.message 
    });
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
        success: false,
        message: "Student not linked to any teacher"
      });
    }

    // Get quiz and verify it exists
    const quiz = await Quiz.findById(quizId).select('-questions.correctOption');
    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: "Quiz not found"
      });
    }

    // Verify quiz has questions
    if (!quiz.questions || quiz.questions.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Quiz has no questions available"
      });
    }

    // CRITICAL: Verify student can only access their teacher's quiz
    if (quiz.teacherId.toString() !== student.teacherId.toString()) {
      return res.status(403).json({
        success: false,
        message: "You can only access quizzes from your assigned teacher"
      });
    }

    res.json({ quiz });
  } catch (err) {
    res.status(500).json({ 
      success: false,
      message: err.message 
    });
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
      return res.json({ quizzes: [] });
    }

    const quizzes = await Quiz.find({
      teacherId: student.teacherId,
      class: student.class
    })
      .select('title subject class duration totalMarks questions createdAt startTime endTime')
      .sort({ createdAt: -1 });

    // Get attempted quiz IDs
    const attemptedQuizzes = await Marks.find({
      studentId: req.user.id
    }).distinct('quizId');

    // Format response and include all quizzes (attempted and unattempted)
    const availableQuizzes = quizzes.map(quiz => {
      const quizIdStr = quiz._id.toString();
      const isSubmitted = attemptedQuizzes.some(attemptedId => 
        attemptedId.toString() === quizIdStr
      );
      
      return {
        _id: quiz._id,
        title: quiz.title,
        subject: quiz.subject,
        class: quiz.class,
        totalQuestions: quiz.questions ? quiz.questions.length : 0,
        duration: quiz.duration,
        startDate: quiz.startTime,
        endDate: quiz.endTime,
        alreadySubmitted: isSubmitted
      };
    });

    res.json({ quizzes: availableQuizzes });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.checkQuizAttemptStatus = async (req, res) => {
  try {
    const quizId = req.params.id;
    const studentId = req.user.id;

    // Check if student has already submitted this quiz
    const existingAttempt = await Marks.findOne({
      studentId: studentId,
      quizId: quizId
    });

    res.json({ 
      alreadySubmitted: !!existingAttempt,
      attemptDate: existingAttempt?.createdAt
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getSpecificQuizResult = async (req, res) => {
  try {
    const quizId = req.params.id;
    const studentId = req.user.id;
    
    const result = await Marks.findOne({
      studentId: studentId,
      quizId: quizId
    })
      .populate('quizId', 'title subject questions');
      
    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Quiz result not found'
      });
    }
    
    res.json({
      success: true,
      result: {
        quizId: result.quizId,
        quiz: result.quiz,
        score: result.score,
        totalMarks: result.totalMarks,
        percentage: result.percentage,
        attemptedAt: result.createdAt,
        submittedAt: result.createdAt,
        totalQuestions: result.quiz?.questions?.length || 10
      }
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch quiz result: " + err.message
    });
  }
};

exports.getStudentResults = async (req, res) => {
  try {
    const results = await Marks.find({
      studentId: req.user.id
    })
      .populate('quizId', 'title subject questions')
      .sort({ createdAt: -1 });

    res.json({ results });
  } catch (err) {
    res.status(500).json({
      message: "Failed to fetch quiz results: " + err.message
    });
  }
};

exports.getQuizAttemptTracking = async (req, res) => {
  try {
    const quizId = req.params.id;
    const teacherId = req.user.id;

    if (!quizId || !mongoose.Types.ObjectId.isValid(quizId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid quiz ID"
      });
    }

    const quiz = await Quiz.findOne({
      _id: quizId,
      teacherId: teacherId
    }).select('title subject class totalMarks');

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found'
      });
    }

    // Students "assigned" to this quiz = same teacher and same class
    const assignedStudents = await User.find({
      role: 'student',
      teacherId: teacherId,
      class: quiz.class
    }).select('_id fullName').lean();

    const studentIds = assignedStudents.map(s => s._id);

    const attempts = await Marks.find({
      quizId: quizId,
      studentId: { $in: studentIds }
    }).lean();

    const attemptedSet = new Set(attempts.map(a => a.studentId.toString()));
    const attemptByStudent = {};
    attempts.forEach(a => {
      attemptByStudent[a.studentId.toString()] = {
        score: a.score,
        totalMarks: a.totalMarks,
        attemptedAt: a.createdAt
      };
    });

    const attempted = [];
    const notAttempted = [];

    assignedStudents.forEach(student => {
      const idStr = student._id.toString();
      const record = {
        studentId: student._id,
        fullName: student.fullName
      };
      if (attemptedSet.has(idStr)) {
        const a = attemptByStudent[idStr];
        attempted.push({
          ...record,
          score: a.score,
          totalMarks: a.totalMarks,
          attemptedAt: a.attemptedAt
        });
      } else {
        notAttempted.push(record);
      }
    });

    // Sort attempted by attemptedAt desc (most recent first)
    attempted.sort((a, b) => new Date(b.attemptedAt) - new Date(a.attemptedAt));

    res.json({
      success: true,
      quiz: {
        _id: quiz._id,
        title: quiz.title,
        subject: quiz.subject,
        class: quiz.class,
        totalMarks: quiz.totalMarks
      },
      totalStudents: assignedStudents.length,
      attemptedCount: attempted.length,
      notAttemptedCount: notAttempted.length,
      attempted,
      notAttempted
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

exports.uploadQuizCsv = async (req, res) => {
  try {
    const { title, class: className, subject, totalMarks, startTime, endTime, duration } = req.body;
    const questions = req.validatedQuestions;

    if (!title || !className || !subject || !startTime || !endTime || !duration) {
      return res.status(400).json({
        message: "Quiz title, class, subject, start time, end time, and duration are required"
      });
    }

    const startDate = new Date(startTime);
    const endDate = new Date(endTime);
    const durationNum = parseInt(duration);

    if (endDate <= startDate) {
      return res.status(400).json({ message: "End time must be after start time" });
    }

    const calculatedTotalMarks = totalMarks || questions.length;

    const quiz = new Quiz({
      title,
      class: className,
      subject,
      questions,
      totalMarks: calculatedTotalMarks,
      startTime: startDate,
      endTime: endDate,
      duration: durationNum,
      teacherId: req.user.id
    });

    await quiz.save();

    res.status(201).json({
      message: "Quiz created successfully from CSV",
      quiz: {
        id: quiz._id,
        title: quiz.title,
        class: quiz.class,
        subject: quiz.subject,
        totalQuestions: questions.length,
        totalMarks: quiz.totalMarks
      }
    });

  } catch (error) {
    console.error('Error in uploadQuizCsv:', error);
    res.status(500).json({
      message: "Failed to create quiz from CSV: " + error.message
    });
  }
};