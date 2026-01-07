const User = require("../models/user");
const bcrypt = require("bcryptjs");
const { createToken } = require("../services/tokenService");

exports.signup = async (req, res) => {
  try {
    const {
      userId,
      fullName,
      email,
      password,
      age,
      city,
      state,
      mobileNo,
      role,
      class: studentClass
    } = req.body;

    const hashed = await bcrypt.hash(password, 10);

    let profileImage = "";
    const file =
      (req.files && req.files.profileImage && req.files.profileImage[0]) ||
      (req.files && req.files.profile && req.files.profile[0]) ||
      (req.files && req.files.avatar && req.files.avatar[0]);
    if (file) profileImage = file.path;

    const userData = {
      userId,
      fullName,
      email,
      password: hashed,
      age,
      city,
      state,
      mobileNo,
      role: role || "student",
      profileImage
    };

    if (role === "student" && studentClass) {
      userData.class = studentClass;
    }

    const user = await User.create(userData);
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      user: userResponse
    });

  } catch (err) {
    console.error("Signup error:", err);
    
    if (err.code === 11000) {
      const field = Object.keys(err.keyValue)[0];
      const fieldMessages = {
        email: "Email address is already registered",
        userId: "User ID is already taken",
        mobileNo: "Mobile number is already registered"
      };
      
      return res.status(400).json({
        success: false,
        message: fieldMessages[field] || `${field} already exists`
      });
    }

    res.status(500).json({ 
      success: false,
      message: "Registration failed. Please try again later." 
    });
  }
};


exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select("+password");
    if (!user) return res.status(400).json({ message: "Invalid Credentials" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ message: "Invalid Credentials" });

    const token = createToken(user);

    res.json({ message: "Login success", token, user });
  } catch (err) {
    res.status(500).json({ message: "Login failed" });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { fullName, email, mobileNo, city, state } = req.body;

    const updateData = {
      fullName,
      email,
      mobileNo,
      city,
      state
    };

    // Handle profile image upload
    const file =
      (req.files && req.files.profileImage && req.files.profileImage[0]) ||
      (req.files && req.files.profile && req.files.profile[0]) ||
      (req.files && req.files.avatar && req.files.avatar[0]) ||
      (req.files && req.files.image && req.files.image[0]);
    
    if (file) {
      updateData.profileImage = file.path;
    }

    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      success: true,
      message: "Profile updated successfully",
      user
    });

  } catch (err) {
    console.error("Update profile error:", err);
    
    if (err.code === 11000) {
      const field = Object.keys(err.keyValue)[0];
      const fieldMessages = {
        email: "Email address is already registered",
        mobileNo: "Mobile number is already registered"
      };
      
      return res.status(400).json({
        success: false,
        message: fieldMessages[field] || `${field} already exists`
      });
    }

    res.status(500).json({ 
      success: false,
      message: "Profile update failed. Please try again later." 
    });
  }
};