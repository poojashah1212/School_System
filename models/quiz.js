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

    totalMarks: { type: Number, required: true },
    startTime: { type: Date, required: false },
    endTime: { type: Date, required: false },
    duration: { type: Number, required: false }, // in minutes

    status: {
      type: String,
      enum: ["draft", "published"],
      default: "published"
    },

    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Quiz", quizSchema);
