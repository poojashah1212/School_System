const mongoose = require("mongoose");

const submissionSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    submissionDate: {
        type: Date,
        default: Date.now
    },
    fileUrl: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ["Pending", "Evaluated"],
        default: "Pending"
    },
    marks: {
        type: Number
    },
    feedback: {
        type: String
    }
});

const assignmentSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String
    },
    class: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ClassSubject", // Based on Material.js model
        required: true
    },
    subject: {
        type: String,
        required: true
    },
    deadline: {
        type: Date,
        required: true
    },
    fileUrl: {
        type: String
    },
    teacher: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    submissions: [submissionSchema]
}, { timestamps: true });

module.exports = mongoose.model("Assignment", assignmentSchema);
