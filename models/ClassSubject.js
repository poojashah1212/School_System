const mongoose = require("mongoose");

const SubjectSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    code: {
        type: String,
        required: true,
    },
    credits: {
        type: Number,
        default: 3,
    },
    assignedTeacher: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null
    },
    assignmentDate: {
        type: Date,
        default: null
    }
}, { _id: true });

const ClassSubjectSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    grade: {
        type: String,
        required: true,
    },
    assignedTeacher: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null
    },
    assignmentDate: {
        type: Date,
        default: null
    },
    subjects: [SubjectSchema],
    timetable: [{
        day: {
            type: String,
            required: true
        },
        startTime: {
            type: String,
            required: true
        },
        endTime: {
            type: String,
            required: true
        },
        subjectName: {
            type: String,
            required: true
        },
        subjectCode: {
            type: String,
            required: true
        },
        teacherName: {
            type: String,
            required: true
        },
        teacherId: {
            type: String,
            required: true
        }
    }],
    fees: {
        type: Number,
        default: 0
    },
    examFees: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

// Ensure unique grade
ClassSubjectSchema.index({ grade: 1 }, { unique: true });

module.exports = mongoose.model("ClassSubject", ClassSubjectSchema);
