const fs = require("fs");
const csv = require("csv-parser");
const { body, validationResult } = require("express-validator");

const quizValidators = [
  body("title")
    .notEmpty()
    .withMessage("Title is required"),

  body("class")
    .notEmpty()
    .withMessage("Class is required"),

  body("subject")
    .notEmpty()
    .withMessage("Subject is required"),

  body("question")
    .notEmpty()
    .withMessage("Question is required"),

  body("optionA").notEmpty().withMessage("Option A is required"),
  body("optionB").notEmpty().withMessage("Option B is required"),
  body("optionC").notEmpty().withMessage("Option C is required"),
  body("optionD").notEmpty().withMessage("Option D is required"),

  body("correctOption")
    .isIn(["A", "B", "C", "D"])
    .withMessage("Correct option must be A/B/C/D"),

  body("marks")
    .isInt({ min: 1 })
    .withMessage("Marks must be positive number")
];

exports.quizCSVValidation = (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({ message: "CSV file is required" });
  }

  const { title, class: className, subject } = req.body;

  if (!title || !className || !subject) {
    return res.status(400).json({
      message: "title, class and subject are required in body"
    });
  }

  const rows = [];
  const skippedDetails = [];

  fs.createReadStream(req.file.path)
    .pipe(csv())
    .on("data", (row) => rows.push(row))
    .on("end", async () => {
      for (let i = 0; i < rows.length; i++) {

        const fakeReq = {
          body: {
            title,              
            class: className,   
            subject,           
            question: rows[i].question,
            optionA: rows[i].optionA,
            optionB: rows[i].optionB,
            optionC: rows[i].optionC,
            optionD: rows[i].optionD,
            correctOption: rows[i].correctOption,
            marks: rows[i].marks
          }
        };

        for (const rule of quizValidators) {
          await rule.run(fakeReq);
        }

        const errors = validationResult(fakeReq);

        if (!errors.isEmpty()) {
          skippedDetails.push({
            row: i + 2,
            question: rows[i].question || null,
            reasons: errors.array().map(e => e.msg)
          });
        } else {
          rows[i] = fakeReq.body; 
        }
      }

      req.csvRows = rows;
      req.csvSkippedDetails = skippedDetails;
      next();
    });
};