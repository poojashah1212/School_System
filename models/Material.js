const mongoose = require("mongoose");

const MaterialSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
    },
    type: {
        type: String,
        enum: ["PDF", "VIDEO", "DOC", "MP4"],
        required: true,
    },
    fileUrl: {
        type: String,
        required: true,
    },
    thumbnailUrl: {
        type: String,
    },
    teacher: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    class: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ClassSubject",
    },
    subject: {
        type: String,
    },
    tags: [String],
}, { timestamps: true });

module.exports = mongoose.model("Material", MaterialSchema);
