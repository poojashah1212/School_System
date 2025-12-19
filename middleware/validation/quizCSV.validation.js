const fs = require("fs");
const csv = require("csv-parser");
const { body, validationResult } = require("express-validator");

const quizValidators = [
  body("question").notEmpty().withMessage("Question is required"),
  body("optionA").notEmpty(),
  body("optionB").notEmpty(),
  body("optionC").notEmpty(),
  body("optionD").notEmpty(),
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

  const rows = [];
  const skippedDetails = [];

  fs.createReadStream(req.file.path)
    .pipe(csv())
    .on("data", (row) => rows.push(row))
    .on("end", async () => {
      for (let i = 0; i < rows.length; i++) {
        const fakeReq = { body: rows[i] };

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
        }
      }

      req.csvRows = rows;
      req.csvSkippedDetails = skippedDetails;
      next();
    });
};
