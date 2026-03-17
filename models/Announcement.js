const mongoose = require("mongoose");

const announcementSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    content: {
        type: String,
        required: true
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    targetAudience: {
        type: String,
        enum: ["all", "teachers", "students", "parents", "class"],
        default: "all"
    },
    targetClass: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ClassSubject",
        required: false
    },
    category: {
        type: String,
        enum: ["General", "Academic", "Event", "Holiday", "Urgent"],
        default: "General"
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("Announcement", announcementSchema);
