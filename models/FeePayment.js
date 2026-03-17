const mongoose = require("mongoose");

const FeePaymentSchema = new mongoose.Schema({
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    amountINR: {
        type: Number,
        required: true
    },
    localAmount: {
        type: Number,
        required: true
    },
    localCurrency: {
        type: String,
        required: true
    },
    paymentDate: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        enum: ["Completed", "Pending", "Failed"],
        default: "Completed"
    },
    transactionId: {
        type: String,
        required: true,
        unique: true
    },
    paymentMethod: {
        type: String,
        default: "Online"
    }
}, { timestamps: true });

module.exports = mongoose.model("FeePayment", FeePaymentSchema);
