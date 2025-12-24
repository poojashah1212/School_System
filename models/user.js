const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
      minlength: [2, "Full name must be at least 2 characters"],
      maxlength: [50, "Full name cannot exceed 50 characters"]
    },
    userId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    age: {
      type: Number,
      required: true,
      min: [1, "Age must be at least 1"]
    },
    teacherId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "User",
  required: function () {
    return this.role === "student";
  }
},  
  timezone: {
    type: String,
    default: "Asia/Kolkata" 
  },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: [true, "Email already exists"],
      lowercase: true,
      match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, "Please provide a valid email"]
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false
    },
    mobileNo: {
      type: String,
      required: [true, "Mobile number is required"],
      match: [/^[0-9]{10}$/, "Mobile number must be exactly 10 digits"],
      unique: [true, "Mobile number already exists"]
    },
    city: {
      type: String,
      required: [true, "City is required"],
      trim: true
    },
    state: {
      type: String,
      required: [true, "State is required"],
      trim: true
    },
    class: {
      type: String,
      required: function () {
        return this.role === "student";
      },
    },
    role: {
      type: String,
      enum: {
        values: ["student", "teacher"],
        message: "Role must be either 'student' or 'teacher'"
      },
      default: "student"
    },
    profileImage: {
  type: String,
  default: ""
}


  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
