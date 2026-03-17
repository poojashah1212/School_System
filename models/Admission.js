const mongoose = require('mongoose');

const admissionSchema = new mongoose.Schema({
    applicationId: {
        type: String,
        required: true,
        unique: true
    },
    studentName: {
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
    grade: {
        type: String,
        required: true
    },
    studentEmail: {
        type: String
    },
    studentPhone: {
        type: String
    },
    parentName: {
        type: String,
        required: true
    },
    relation: {
        type: String,
        enum: ['father', 'mother', 'guardian'],
        required: true
    },
    phone: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    occupation: {
        type: String
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
        type: String,
        required: true
    },
    country: {
        type: String,
        required: true
    },
    timezone: {
        type: String,
        default: 'UTC'
    },
    photo: {
        type: String
    },
    birthCert: {
        type: String
    },
    previousMarks: {
        type: String
    },
    transferCert: {
        type: String
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    studentId: {
        type: String,
        unique: true,
        sparse: true
    },
    username: {
        type: String,
        unique: true,
        sparse: true
    },
    password: {
        type: String
    },
    isActive: {
        type: Boolean,
        default: false
    },
    firstLogin: {
        type: Boolean,
        default: true
    },
    credentialsSent: {
        type: Boolean,
        default: false
    },
    credentialsSentDate: {
        type: Date
    },
    submissionDate: {
        type: Date,
        default: Date.now
    },
    reviewedBy: {
        type: String
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

module.exports = mongoose.model('Admission', admissionSchema);
