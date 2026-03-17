const User = require("../models/user");
const bcrypt = require("bcryptjs");
const { createToken } = require("../services/tokenService");

const ADMIN_EMAIL = 'admin@gmail.com';
const ADMIN_PASSWORD = 'Admin123';

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

    // Email functionality commented out
    // if (user.role === "teacher") {
    //   try {
    //     const emailResult = await sendEmail({
    //       to: user.email,
    //       subject: emailTemplates.teacher_signup.subject,
    //       html: emailTemplates.teacher_signup.html(user.fullName)
    //     });
    //     
    //     if (emailResult.success) {
    //       console.log(`Welcome email sent to teacher: ${user.email}`);
    //     } else {
    //       console.error(`Failed to send welcome email to teacher: ${emailResult.error}`);
    //     }
    //   } catch (emailError) {
    //     console.error("Error sending teacher welcome email:", emailError);
    //   }
    // }

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

    // Check for admin login
    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      // Find or create admin user
      let adminUser = await User.findOne({ email: ADMIN_EMAIL });
      
      if (!adminUser) {
        // Create admin user if doesn't exist
        const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);
        adminUser = await User.create({
          userId: 'ADMIN001',
          fullName: 'Administrator',
          email: ADMIN_EMAIL,
          password: hashedPassword,
          age: 30,
          mobileNo: '1234567890',
          city: 'Admin City',
          state: 'Admin State',
          role: 'admin'
        });
      }

      const token = createToken(adminUser);

      return res.json({ 
        message: "Login success", 
        token, 
        user: {
          _id: adminUser._id,
          userId: adminUser.userId,
          fullName: adminUser.fullName,
          email: adminUser.email,
          role: adminUser.role,
          profileImage: adminUser.profileImage
        }
      });
    }

    const user = await User.findOne({ email }).select("+password");
    if (!user) return res.status(400).json({ message: "Invalid Credentials" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ message: "Invalid Credentials" });

    if (user.role === 'student') {
      const Admission = require('../models/Admission');
      const admission = await Admission.findOne({ studentId: user.userId });
      
      if (!admission) {
        return res.status(403).json({ 
          message: "Your account is not yet approved. Please contact the administrator." 
        });
      }

      // Allow login for both approved and rejected students
      if (admission.status !== 'approved' && admission.status !== 'rejected') {
        return res.status(403).json({ 
          message: "Your account is not yet approved. Please contact the administrator." 
        });
      }

      if (!admission.isActive) {
        return res.status(403).json({ 
          message: "Your account has been deactivated. Please contact the administrator." 
        });
      }

      const isFirstLogin = admission.firstLogin === true;
      
      const token = createToken(user);

      return res.json({ 
        message: "Login success", 
        token, 
        user,
        firstLogin: isFirstLogin,
        admissionStatus: admission.status
      });
    }

    const token = createToken(user);

    res.json({ message: "Login success", token, user });
  } catch (err) {
    res.status(500).json({ message: "Login failed" });
  }
};

exports.getProfile = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ 
        success: false,
        message: "User not authenticated properly" 
      });
    }
    
    const userId = req.user.id;
    
    const user = await User.findById(userId).select('-password');
    
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: "User not found" 
      });
    }

    res.json({
      success: true,
      user
    });

  } catch (err) {
    res.status(500).json({ 
      success: false,
      message: "Failed to fetch profile" 
    });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { fullName, email, mobileNo, city, state, timezone } = req.body;

    const updateData = {
      fullName,
      email,
      mobileNo,
      city,
      state
    };

    // Update timezone if provided
    if (timezone) {
      updateData.timezone = timezone;
    }

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

exports.changePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "All password fields are required"
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "New passwords do not match"
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters"
      });
    }

    const user = await User.findById(userId).select("+password");
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    const match = await bcrypt.compare(currentPassword, user.password);
    if (!match) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect"
      });
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedNewPassword;
    await user.save();

    if (user.role === 'student') {
      const Admission = require('../models/Admission');
      const admission = await Admission.findOne({ studentId: user.userId });
      if (admission) {
        admission.firstLogin = false;
        await admission.save();
      }
    }

    res.json({
      success: true,
      message: "Password changed successfully"
    });

  } catch (err) {
    console.error("Change password error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to change password"
    });
  }
};