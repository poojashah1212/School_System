const mongoose = require('mongoose');

const teacherApplicationSchema = new mongoose.Schema({
    applicationId: {
        type: String,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true
    },
    dob: {
        type: Date,
        required: true
    },
    gender: {
        type: String,
        enum: ['male', 'female', 'other'],
        required: true
    },
    email: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true
    },
    maritalStatus: {
        type: String,
        enum: ['single', 'married', 'divorced']
    },
    position: {
        type: String,
        default: 'teacher'
    },
    department: {
        type: String,
        required: true
    },
    experience: {
        type: String,
        required: true
    },
    degree: {
        type: String,
        required: true
    },
    institution: {
        type: String,
        required: true
    },
    yearPassed: {
        type: Number
    },
    percentage: {
        type: String
    },
    additionalDegree: {
        type: String
    },
    additionalInstitution: {
        type: String
    },
    previousWork: {
        type: String
    },
    skills: {
        type: String,
        required: true
    },
    address: {
        type: String,
        required: true
    },
    city: {
        type: String,
        required: true
    },
    state: {
        type: String,
        required: true
    },
    zip: {
        type: String
    },
    country: {
        type: String,
        required: true
    },
    timezone: {
        type: String,
        default: 'UTC'
    },
    resume: {
        type: String
    },
    coverLetter: {
        type: String
    },
    certificates: {
        type: [String]
    },
    photo: {
        type: String
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    submissionDate: {
        type: Date,
        default: Date.now
    },
    reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    reviewedDate: {
        type: Date
    },
    notes: {
        type: String
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('TeacherApplication', teacherApplicationSchema);
