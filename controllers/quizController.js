const Quiz = require("../models/quiz");
const User = require("../models/user");
const Marks = require("../models/marks");

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

    res.json({ quizzes });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createQuiz = async (req, res) => {
  try {
    const { title, class: className, subject, questions, totalMarks, startTime, endTime, duration, status } = req.body;

    if (status === 'draft') {
      if (!title) {
        return res.status(400).json({ message: "Quiz title is required for draft" });
      }
    } else {
      // For published mode, all fields are required
      if (!title || !className || !subject || !questions?.length || !startTime || !endTime || !duration) {
        return res.status(400).json({ message: "All fields required" });
      }

      const startDate = new Date(startTime);
      const endDate = new Date(endTime);
      const durationNum = parseInt(duration);

      if (endDate <= startDate) {
        return res.status(400).json({ message: "End time must be after start time" });
      }

      if (durationNum < 1) {
        return res.status(400).json({ message: "Duration must be at least 1 minute" });
      }
    }

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
      message,
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

    const { title, class: className, subject, questions, totalMarks, startTime, endTime, duration, status } = req.body;

    if (title) quiz.title = title;
    if (className) quiz.class = className;
    if (subject) quiz.subject = subject;

    if (questions) {
      quiz.questions = questions;
    }

    if (totalMarks !== undefined) {
      quiz.totalMarks = totalMarks;
    }

    if (startTime) {
      const startDate = new Date(startTime);
      quiz.startTime = startDate;
    }

    if (endTime) {
      const endDate = new Date(endTime);

      if (quiz.startTime && endDate <= quiz.startTime) {
        return res.status(400).json({ message: "End time must be after start time" });
      }
      quiz.endTime = endDate;
    }

    if (duration !== undefined) {
      const durationNum = parseInt(duration);
      if (durationNum < 1) {
        return res.status(400).json({ message: "Duration must be at least 1 minute" });
      }
      quiz.duration = durationNum;
    }

    // Handle status update
    if (status !== undefined) {
      quiz.status = status;
    }

    // Final validation if both start and end times are present
    if (quiz.startTime && quiz.endTime && quiz.endTime <= quiz.startTime) {
      return res.status(400).json({ message: "End time must be after start time" });
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
    const { quizId, studentId, answers, timeTaken, timeTakenSeconds, submittedAt, studentName, teacherId } = req.body;
    
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

    // Check if student is linked to teacher (use provided teacherId or fallback to student.teacherId)
    const assignedTeacherId = teacherId || student.teacherId;
    if (!assignedTeacherId) {
      return res.status(403).json({
        success: false,
        message: "Student not linked to any teacher. Please contact your administrator."
      });
    }

    // Verify student can attempt this quiz
    if (quiz.teacherId.toString() !== assignedTeacherId.toString()) {
      return res.status(403).json({
        success: false,
        message: "You cannot attempt another teacher's quiz"
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
        message: "You have already submitted this quiz",
        data: {
          totalQuestions: quiz.questions.length,
          correctAnswers: alreadyAttempted.score,
          wrongAnswers: quiz.questions.length - alreadyAttempted.score,
          scorePercentage: Math.round((alreadyAttempted.score / quiz.questions.length) * 100),
          status: alreadyAttempted.score >= Math.ceil(quiz.questions.length * 0.5) ? 'Pass' : 'Fail'
        }
      });
    }

    // Calculate Score Properly
    let correctAnswers = 0;
    let wrongAnswers = 0;
    
    quiz.questions.forEach((question, index) => {
      const userAnswer = answers[index];
      const correctOption = question.correctOption;
      
      // Simple comparison: convert both to same format
      let isCorrect = false;
      
      // If userAnswer is a number (0,1,2,3), convert to letter
      const userAnswerLetter = typeof userAnswer === 'number' ? 
        String.fromCharCode(65 + userAnswer) : userAnswer;
      
      // If correctOption is a number (0,1,2,3), convert to letter  
      const correctOptionLetter = typeof correctOption === 'number' ? 
        String.fromCharCode(65 + correctOption) : correctOption;
      
      // Compare letters
      isCorrect = userAnswerLetter === correctOptionLetter;
      
      console.log(`Question ${index + 1}: User=${userAnswerLetter}, Correct=${correctOptionLetter}, Match=${isCorrect}`);
      
      if (isCorrect) {
        correctAnswers++;
      } else {
        wrongAnswers++;
      }
    });

    const totalQuestions = quiz.questions.length;
    const scorePercentage = Math.round((correctAnswers / totalQuestions) * 100);
    const status = scorePercentage >= 50 ? 'Pass' : 'Fail';

    // Save results in database
    const result = await Marks.create({
      studentId,
      quizId: quiz._id,
      teacherId: quiz.teacherId,
      score: correctAnswers,
      totalMarks: quiz.totalMarks || totalQuestions,
      percentage: scorePercentage,
      timeTaken,
      submittedAt: new Date()
    });

    // Return result data in exact format requested
    return res.status(201).json({
      success: true,
      message: "Quiz submitted successfully!",
      data: {
        totalQuestions,
        correctAnswers,
        wrongAnswers,
        scorePercentage,
        status
      }
    });

  } catch (err) {
    console.error('Quiz submission error:', err);
    return res.status(500).json({
      success: false,
      message: "Internal server error during quiz submission",
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
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

    // Verify quiz has questions
    if (!quiz.questions || quiz.questions.length === 0) {
      return res.status(404).json({
        message: "Quiz has no questions available"
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
    const availableQuizzes = quizzes.map(quiz => ({
      _id: quiz._id,
      title: quiz.title,
      subject: quiz.subject,
      class: quiz.class,
      totalQuestions: quiz.questions ? quiz.questions.length : 0,
      duration: quiz.duration,
      startDate: quiz.startTime,
      endDate: quiz.endTime,
      alreadySubmitted: attemptedQuizzes.includes(quiz._id.toString())
    }));

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

exports.getStudentResults = async (req, res) => {
  try {
    const results = await Marks.find({
      studentId: req.user.id
    })
      .populate('quizId', 'title subject')
      .sort({ createdAt: -1 });

    res.json({ results });
  } catch (err) {
    res.status(500).json({
      message: "Failed to fetch quiz results: " + err.message
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