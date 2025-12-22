const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true
  },
  options: {
    type: [String], // ["A text", "B text", "C text", "D text"]
    required: true,
    validate: v => v.length === 4
  },
  correctOption: {
    type: String,
    enum: ["A", "B", "C", "D"],
    required: true
  }
});

const quizSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    class: { type: String, required: true },
    subject: { type: String, required: true },

    questions: [questionSchema],

    totalMarks: { type: Number },

    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Quiz", quizSchema);
