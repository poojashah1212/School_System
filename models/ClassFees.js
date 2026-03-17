const mongoose = require("mongoose");

const ClassFeesSchema = new mongoose.Schema({
    class_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ClassSubject",
        required: true,
        unique: true
    },
    exam_fees: {
        type: Number,
        required: true,
        default: 0
    },
    annual_fees: {
        type: Number,
        required: true,
        default: 0
    },
    total_fees: {
        type: Number,
        required: true,
        default: 0
    }
}, {
    timestamps: true
});

// Pre-validate hook to calculate total_fees before validation and save
ClassFeesSchema.pre("validate", function() {
    this.total_fees = (this.exam_fees || 0) + (this.annual_fees || 0);
});

// Pre-update hook to calculate total_fees if exam_fees or annual_fees are being updated
ClassFeesSchema.pre("findOneAndUpdate", function() {
    const update = this.getUpdate();
    
    // If we're updating annual_fees or exam_fees, we need to recalculate total_fees
    if (update.annual_fees !== undefined || update.exam_fees !== undefined) {
        // If both are provided, calculate total
        if (update.annual_fees !== undefined && update.exam_fees !== undefined) {
            update.total_fees = parseFloat(update.annual_fees) + parseFloat(update.exam_fees);
        }
    }
});

module.exports = mongoose.model("ClassFees", ClassFeesSchema);
