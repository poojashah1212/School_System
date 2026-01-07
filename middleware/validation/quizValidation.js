const { body, param } = require("express-validator");

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

  body("totalMarks")
    .isInt({ min: 1 })
    .withMessage("Total marks must be a positive integer")
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
