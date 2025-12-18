const { body, param, validationResult } = require("express-validator");
const fs = require("fs");
const csv = require("csv-parser");

const studentCreate = [
  body("userId")
    .trim()
    .notEmpty()
    .withMessage("UserId is required"),

  body("fullName")
    .trim()
    .notEmpty()
    .withMessage("Full name is required")
    .isLength({ min: 2, max: 50 })
    .withMessage("Full name must be between 2 and 50 characters"),

  body("email")
    .trim()
    .isEmail()
    .withMessage("Valid email is required")
    .normalizeEmail(),

  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),

  body("mobileNo")
    .matches(/^[0-9]{10}$/)
    .withMessage("Mobile number must be exactly 10 digits"),

  body("class")
    .notEmpty()
    .withMessage("Class is required"),

  body("city").optional().trim(),
  body("state").optional().trim()
];


const studentUpdate = [
  body("fullName")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Full name cannot be empty"),

  body("email")
    .optional()
    .trim()
    .isEmail()
    .withMessage("Invalid email")
    .normalizeEmail(),

  body("mobileNo")
    .optional()
    .matches(/^[0-9]{10}$/)
    .withMessage("Mobile number must be exactly 10 digits"),

  body("class")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Class cannot be empty"),

  body("city").optional().trim(),
  body("state").optional().trim()
];


const studentIdParam = [
  param("userId")
    .trim()
    .notEmpty()
    .withMessage("userId param is required")
];


const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(422).json({
      message: "Validation failed",
      errors: errors.array()
    });
  }

  next();
};

const csvStudentValidators = [
  body("userId").trim().notEmpty().withMessage("userId is required"),
  body("fullName").trim().notEmpty().withMessage("name is required").matches(/^[A-Za-z\s]+$/).withMessage("name must contain only letters and spaces"),
  body("email").isEmail().withMessage("email must be valid"),
  body("password").isLength({ min: 6 }).withMessage("password min length is 6"),
  body("age").notEmpty().isInt({ min: 1 }).withMessage("age is required and must be positive integer"),
  body("class").notEmpty().withMessage("class is required for student"),
  body("mobileNo").matches(/^[0-9]{10}$/).withMessage("Mobile number must be exactly 10 digits"),
];


const csvUploadValidation = async (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({ message: "CSV file is required" });
  }

  const rows = [];
  const skippedDetails = [];

  fs.createReadStream(req.file.path)
    .pipe(csv())
    .on("data", (row) => rows.push(row))
    .on("end", async () => {
      for (let i = 0; i < rows.length; i++) {
        const fakeReq = { body: rows[i] };

        for (const rule of csvStudentValidators) {
          await rule.run(fakeReq);
        }

        const errors = validationResult(fakeReq);

        if (!errors.isEmpty()) {
          skippedDetails.push({
            row: i + 2,
            userId: rows[i].userId || null,
            reasons: errors.array().map(e => e.msg)
          });
        }
      }

      req.csvRows = rows;
      req.csvSkippedDetails = skippedDetails;
      next();
    });
};

module.exports = {
  studentCreate,
  studentUpdate,
  studentIdParam,
  validate,
  csvUploadValidation
};
