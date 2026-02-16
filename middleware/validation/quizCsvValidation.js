const csv = require("csv-parser");
const fs = require("fs");

exports.quizCsvUploadValidation = async (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({ message: "No CSV file uploaded" });
  }

  const results = [];
  const errors = [];
  let rowIndex = 2;

  fs.createReadStream(req.file.path)
    .pipe(csv())
    .on('data', (data) => {
      const rowErrors = [];

      // Check required question
      if (!data.Question?.trim()) {
        rowErrors.push('Question is required');
      }

      // Get and validate options
      const options = ['A', 'B', 'C', 'D'].map(letter => 
        data[`Option ${letter}`] || data[`Option_${letter}`] || ''
      );

      const optionLabels = ['A', 'B', 'C', 'D'];
      options.forEach((option, index) => {
        if (!option.trim()) {
          rowErrors.push(`Option ${optionLabels[index]} is required`);
        }
      });

      // Validate correct answer
      const correctAnswer = (data['Correct Answer'] || data['Correct_Answer'] || '')
        .toUpperCase().trim();
      
      if (!['A', 'B', 'C', 'D'].includes(correctAnswer)) {
        rowErrors.push('Correct Answer must be A, B, C, or D');
      }

      if (rowErrors.length > 0) {
        errors.push({ row: rowIndex, errors: rowErrors });
      } else {
        results.push({
          question: data.Question.trim(),
          options: options.map(opt => opt.trim()),
          correctOption: correctAnswer
        });
      }

      rowIndex++;
    })
    .on('end', () => {
      fs.unlinkSync(req.file.path);

      if (errors.length > 0) {
        return res.status(400).json({
          message: "CSV validation failed",
          errors: errors,
          validQuestions: results.length
        });
      }

      if (results.length === 0) {
        return res.status(400).json({ message: "No valid questions found" });
      }

      req.validatedQuestions = results;
      next();
    })
    .on('error', () => {
      if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      res.status(500).json({ message: "Error parsing CSV" });
    });
};
