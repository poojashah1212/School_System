const { body, param, query } = require("express-validator");

exports.createQuizValidation = [

  body("title")
    .trim()
    .notEmpty()
    .withMessage("Title is required"),

  body("class")
    .trim()
    .notEmpty()
    .withMessage("Class is required"),

  body("subject")
    .trim()
    .notEmpty()
    .withMessage("Subject is required"),

  body("questions")
    .isArray({ min: 1 })
    .withMessage("At least one question is required"),

  body("questions.*.question")
    .trim()
    .notEmpty()
    .withMessage("Question text is required"),

  body("questions.*.options")
    .isArray({ min: 4, max: 4 })
    .withMessage("Each question must have exactly 4 options"),

  body("questions.*.options.*")
    .trim()
    .notEmpty()
    .withMessage("Option cannot be empty"),

  body("questions.*.correctOption")
    .isIn(["A", "B", "C", "D"])
    .withMessage("Correct option must be A, B, C or D"),

  // Schedule field validations
  body("startTime")
    .notEmpty()
    .withMessage("Start time is required")
    .isISO8601()
    .withMessage("Start time must be a valid date"),

  body("endTime")
    .notEmpty()
    .withMessage("End time is required")
    .isISO8601()
    .withMessage("End time must be a valid date"),

  body("duration")
    .isInt({ min: 1 })
    .withMessage("Duration must be at least 1 minute"),

  // Custom validation for date logic
  body().custom((value, { req }) => {
    const { startTime, endTime } = req.body;
    if (startTime && endTime) {
      const startDate = new Date(startTime);
      const endDate = new Date(endTime);
      if (endDate <= startDate) {
        throw new Error("End time must be after start time");
      }
    }
    return true;
  })
];

exports.updateQuizValidation = [
  param("id")
    .isMongoId()
    .withMessage("Invalid quiz id"),

  body("title")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Title cannot be empty"),

  body("class")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Class cannot be empty"),

  body("subject")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Subject cannot be empty"),

  body("questions")
    .optional()
    .isArray({ min: 1 })
    .withMessage("Questions must be an array with at least one question"),

  body("totalMarks")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Total marks must be at least 1"),

  body("startTime")
    .optional()
    .isISO8601()
    .withMessage("Start time must be a valid date"),

  body("endTime")
    .optional()
    .isISO8601()
    .withMessage("End time must be a valid date"),

  body("duration")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Duration must be at least 1 minute"),

  body("status")
    .optional()
    .isIn(["draft", "published"])
    .withMessage("Status must be draft or published"),

  // Custom validation for date logic
  body().custom((value, { req }) => {
    const { startTime, endTime } = req.body;
    if (startTime && endTime) {
      const startDate = new Date(startTime);
      const endDate = new Date(endTime);
      if (endDate <= startDate) {
        throw new Error("End time must be after start time");
      }
    }
    return true;
  })
];

exports.quizSingleQuestionValidation = [

  param("quizId")
    .isMongoId()
    .withMessage("Invalid quiz id"),

  param("index")
    .isInt({ min: 0 })
    .withMessage("Question index must be 0 or greater"),

  body("question")
    .trim()
    .notEmpty()
    .withMessage("Question is required"),

  body("options")
    .isArray({ min: 4, max: 4 })
    .withMessage("Options must contain exactly 4 values"),

  body("options.*")
    .trim()
    .notEmpty()
    .withMessage("Option cannot be empty"),

  body("correctOption")
    .isIn(["A", "B", "C", "D"])
    .withMessage("Correct option must be A, B, C or D")
];

exports.submitQuizValidation = [
  body("quizId")
    .notEmpty()
    .withMessage("Quiz ID is required"),

  body("studentId")
    .notEmpty()
    .withMessage("Student ID is required"),

  body("answers")
    .isArray({ min: 1 })
    .withMessage("At least one answer is required"),

  body("answers.*")
    .isInt({ min: 0, max: 3 })
    .withMessage("Answer must be 0, 1, 2, or 3")
];

exports.getQuizzesValidation = [
  query("status")
    .optional()
    .isIn(["draft", "published"])
    .withMessage("Status must be draft or published")
];
