const mongoose = require("mongoose");

const SessionSchema = new mongoose.Schema(
  {
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ClassSubject",
      index: true
    },
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      index: true
    },
    allowedStudentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      default: null, 
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    startTime: {
      type: Date,
      required: true
    },
    endTime: {
      type: Date,
      required: true
    },
    dayOfWeek: {
      type: Number, // 0-6 (Sun-Sat)
      default: null
    }
  },
  { timestamps: true }
);

SessionSchema.index({ teacherId: 1, startTime: 1, endTime: 1 });

module.exports = mongoose.model("Session", SessionSchema);
