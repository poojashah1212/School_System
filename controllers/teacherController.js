const User = require("../models/user");
const fs = require("fs");
const csv = require("csv-parser");
const bcrypt = require("bcryptjs");

exports.getStudentById = async (req, res) => {
  try {
    const studentId = req.params.userId;
    let student = null;
    
    // First try by MongoDB _id
    if (studentId.match(/^[0-9a-fA-F]{24}$/)) {
      student = await User.findOne({
        _id: studentId,
        role: "student",
        teacherId: req.user.id
      })
        .select("-password")
        .populate("teacherId", "fullName email");
    }
    
    // If not found by _id, try by userId field
    if (!student) {
      student = await User.findOne({
        userId: studentId,
        role: "student",
        teacherId: req.user.id
      })
        .select("-password")
        .populate("teacherId", "fullName email");
    }

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    res.json(student);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getMyStudents = async (req, res) => {
  try {
    const students = await User.find({
      role: "student",
      teacherId: req.user.id
    }).select("-password");

    console.log('Students fetched from DB:', students.map(s => ({ 
      name: s.fullName, 
      profileImage: s.profileImage,
      userId: s.userId,
      _id: s._id 
    })));

    res.json(students);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.createStudent = async (req, res) => {
  console.log("REQ BODY:", req.body);
  console.log("REQ FILE:", req.file);
  console.log("REQ USER:", req.user);
  try {
    const {
      userId,
      fullName,
      email,
      password,
      age,
      class: className,
      city,
      state,
      mobileNo
    } = req.body;

    if (!userId || !email || !password || !age) {
      return res.status(400).json({ message: "Required fields missing" });
    }

    const exists = await User.findOne({
      $or: [{ userId }, { email }]
    });

    if (exists) {
      return res.status(400).json({ message: "UserId or Email already in use" });
    }

    const hashed = await bcrypt.hash(password, 10);

    const student = await User.create({
      role: "student",
      userId,
      fullName,
      email,
      age,
      city,
      state,
      mobileNo,
      password: hashed,
      class: className,
      teacherId: req.user.id,
      timezone: req.body.timezone || "Asia/Kolkata",
      profileImage: req.file ? `/uploads/profiles/${req.file.filename}` : ""
    });

    // Get updated student count
    const totalStudents = await User.countDocuments({
      role: "student",
      teacherId: req.user.id
    });

    res.status(201).json({
      message: "Student created successfully",
      student: student,
      totalStudents: totalStudents
    });
  } catch (err) {
    console.error("CREATE STUDENT ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.updateStudent = async (req, res) => {
  try {
    const userId = req.params.userId;
    const teacherId = req.user.id;

    const {
      fullName,
      email,
      mobileNo,
      age,
      city,
      state,
      class: className,
      timezone
    } = req.body;

    const updateData = {};

    if (fullName) updateData.fullName = fullName.trim();
    if (age) updateData.age = age;
    if (city) updateData.city = city.trim();
    if (state) updateData.state = state.trim();
    if (className) updateData.class = className;
    if (timezone) updateData.timezone = timezone;
    if (email) {
      const emailQuery = { email: email.toLowerCase().trim() };
      
      // Add exclusion based on ID type
      if (userId.match(/^[0-9a-fA-F]{24}$/)) {
        emailQuery._id = { $ne: userId };
      } else {
        emailQuery.userId = { $ne: userId };
      }
      
      const emailExists = await User.findOne(emailQuery);

      if (emailExists) {
        return res.status(400).json({
          message: "Email already used by another user"
        });
      }

      updateData.email = email.toLowerCase().trim();
    }

    if (mobileNo) {
      const mobileQuery = { mobileNo };
      
      // Add exclusion based on ID type
      if (userId.match(/^[0-9a-fA-F]{24}$/)) {
        mobileQuery._id = { $ne: userId };
      } else {
        mobileQuery.userId = { $ne: userId };
      }
      
      const mobileExists = await User.findOne(mobileQuery);

      if (mobileExists) {
        return res.status(400).json({
          message: "Mobile number already used by another user"
        });
      }

      updateData.mobileNo = mobileNo;
    }

    if (req.file) {
      updateData.profileImage = `/uploads/profiles/${req.file.filename}`;
    }

    let student = null;
    
    // First try by MongoDB _id
    if (userId.match(/^[0-9a-fA-F]{24}$/)) {
      student = await User.findOneAndUpdate({
        _id: userId,
        role: "student",
        teacherId: teacherId
      }, updateData, { new: true }).select("-password");
    }
    
    // If not found by _id, try by userId field
    if (!student) {
      student = await User.findOneAndUpdate({
        userId: userId,
        role: "student",
        teacherId: teacherId
      }, updateData, { new: true }).select("-password");
    }

    if (!student) {
      return res.status(404).json({
        message: "Student not found"
      });
    }

    // Get updated student count
    const totalStudents = await User.countDocuments({
      role: "student",
      teacherId: teacherId
    });

    return res.json({
      message: "Student profile updated successfully",
      student: student,
      totalStudents: totalStudents
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Server error"
    });
  }
};

exports.deleteStudent = async (req, res) => {
  try {
    const teacherId = req.user.id;
    const studentId = req.params.userId;
    
    // Try to find and delete the student by either _id or userId
    let deletedStudent = null;
    
    // First try by MongoDB _id
    if (studentId.match(/^[0-9a-fA-F]{24}$/)) {
      deletedStudent = await User.findOneAndDelete({
        _id: studentId,
        role: "student",
        teacherId: teacherId
      });
    }
    
    // If not found by _id, try by userId field
    if (!deletedStudent) {
      deletedStudent = await User.findOneAndDelete({
        userId: studentId,
        role: "student",
        teacherId: teacherId
      });
    }

    if (!deletedStudent) {
      return res.status(404).json({ 
        message: "Student not found" 
      });
    }

    // Get updated student count
    const totalStudents = await User.countDocuments({
      role: "student",
      teacherId: teacherId
    });

    res.json({ 
      message: "Student deleted successfully",
      studentName: deletedStudent.fullName,
      totalStudents: totalStudents
    });
  } catch (error) {
    console.error("Delete student error:", error);
    res.status(500).json({ 
      message: "Server error while deleting student" 
    });
  }
};
exports.myProfile = async (req, res) => {
  const user = await User.findById(req.user.id)
    .select("-password")
    .populate("teacherId", "fullName email");

  res.json(user);
};

// Get teacher profile
exports.getTeacherProfile = async (req, res) => {
  try {
    const teacher = await User.findById(req.user.id).select("-password");
    
    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    res.json(teacher);
  } catch (error) {
    console.error("Error getting teacher profile:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Update teacher profile
exports.updateTeacherProfile = async (req, res) => {
  try {
    const teacherId = req.user.id;
    const {
      fullName,
      email,
      mobileNo,
      age,
      city,
      state,
      timezone
    } = req.body;

    const updateData = {};

    if (fullName) updateData.fullName = fullName.trim();
    if (age) updateData.age = age;
    if (city) updateData.city = city.trim();
    if (state) updateData.state = state.trim();
    if (timezone) updateData.timezone = timezone;
    
    if (email) {
      const emailExists = await User.findOne({
        email: email.toLowerCase().trim(),
        _id: { $ne: teacherId }
      });

      if (emailExists) {
        return res.status(400).json({
          message: "Email already used by another user"
        });
      }

      updateData.email = email.toLowerCase().trim();
    }

    if (mobileNo) {
      const mobileExists = await User.findOne({
        mobileNo,
        _id: { $ne: teacherId }
      });

      if (mobileExists) {
        return res.status(400).json({
          message: "Mobile number already used by another user"
        });
      }

      updateData.mobileNo = mobileNo;
    }

    if (req.file) {
      updateData.profileImage = `/uploads/profiles/${req.file.filename}`;
    }

    const updatedTeacher = await User.findByIdAndUpdate(
      teacherId,
      updateData,
      { new: true }
    ).select("-password");

    if (!updatedTeacher) {
      return res.status(404).json({
        message: "Teacher not found"
      });
    }

    res.json({
      message: "Profile updated successfully",
      teacher: updatedTeacher
    });
  } catch (error) {
    console.error("Error updating teacher profile:", error);
    res.status(500).json({
      message: "Server error"
    });
  }
};


exports.uploadStudentsCSV = async (req, res) => {
  const teacherId = req.user.id;

  let inserted = 0;
  let skipped = req.csvSkippedDetails.length;
  const results = [...req.csvSkippedDetails];

  for (let i = 0; i < req.csvRows.length; i++) {
    const row = req.csvRows[i];

    const alreadyInvalid = req.csvSkippedDetails.find(r => r.row === i + 2);
    if (alreadyInvalid) continue;

    const {
      userId,
      fullName,
      email,
      password,
      age,
      class: className,
      city,
      state,
      mobileNo,
      timezone
    } = row;

    const exists = await User.findOne({
      $or: [{ userId }, { email }]
    });

    if (exists) {
      skipped++;
      results.push({
        row: i + 2,
        userId,
        reasons: ["UserId or Email already exists"]
      });
      continue;
    }

    try {
      const hashedPassword = await bcrypt.hash(password, 10);

      await User.create({
        role: "student",
        userId,
        fullName,
        email,
        password: hashedPassword,
        age,
        class: className,
        city: city || "",
        state: state || "",
        mobileNo,
        teacherId,
        timezone: timezone || "Asia/Kolkata"
      });

      inserted++;
    } catch (err) {
      skipped++;
      results.push({
        row: i + 2,
        userId,
        reasons: ["Database error: " + err.message]
      });
    }
  }

  fs.unlinkSync(req.file.path);

  return res.json({
    message: "CSV upload completed",
    total: req.csvRows.length,
    inserted,
    skipped,
    skippedDetails: results
  });
};
