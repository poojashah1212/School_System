const mongoose = require("mongoose");


const BookedSlotSchema = new mongoose.Schema({
  startTime: {
    type: Date, required: true
  },
  endTime: {
    type: Date,
    required: true
  },
  bookedBy: {
    type: mongoose.Schema.Types.ObjectId, ref: "User",
    required: true
  },
  bookedAt: {
    type: Date,
    default: Date.now
  }
});

// Create a compound index to prevent duplicate bookings for the same session and time slot
BookedSlotSchema.index({ sessionId: 1, startTime: 1, endTime: 1 }, { unique: true });

const SessionSlotSchema = new mongoose.Schema(
  {
    teacherId: {
      type: mongoose.Schema.Types.ObjectId, ref: "User",
      required: true, index: true
    },


    allowedStudentId: {
      type: mongoose.Schema.Types.ObjectId, ref: "User",
      default: null
    },


    title: {
      type: String, required: true
    },


    date: {
      type: Date, required: true, index: true
    },


    sessionDuration: {

      type: Number, required: true
    },


    breakDuration: {
      type: Number, required: true
    },


    bookedSlots: [BookedSlotSchema]
  },
  { timestamps: true }
);


module.exports = mongoose.model("SessionSlot", SessionSlotSchema);
