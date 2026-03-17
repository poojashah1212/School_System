const mongoose = require("mongoose");

const LiveSessionSchema = new mongoose.Schema(
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
      required: true
    },
    timetableEntryId: {
      type: String,
      default: null
    },
    subjectName: {
      type: String,
      required: true,
      trim: true
    },
    className: {
      type: String,
      required: true,
      trim: true
    },
    grade: {
      type: String,
      required: true
    },
    meetingLink: {
      type: String,
      default: null
    },
    meetingId: {
      type: String,
      default: null
    },
    meetingPassword: {
      type: String,
      default: null
    },
    startUrl: {
      type: String,
      default: null
    },
    isZoomMeeting: {
      type: Boolean,
      default: false
    },
    status: {
      type: String,
      enum: ["pending", "active", "ended"],
      default: "active"
    },
    scheduledDate: {
      type: Date,
      required: true
    },
    startTime: {
      type: String, // e.g. "09:00"
      required: true
    },
    endTime: {
      type: String, // e.g. "10:00"
      required: true
    },
    startedAt: {
      type: Date,
      default: Date.now
    },
    endedAt: {
      type: Date,
      default: null
    },
    attendees: [
      {
        studentId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        studentName: { type: String },
        joinedAt: { type: Date, default: Date.now },
        present: { type: Boolean, default: true }
      }
    ],
    notificationSent: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

LiveSessionSchema.index({ teacherId: 1, scheduledDate: 1 });
LiveSessionSchema.index({ classId: 1, status: 1 });
LiveSessionSchema.index({ meetingId: 1 });

module.exports = mongoose.model("LiveSession", LiveSessionSchema);
