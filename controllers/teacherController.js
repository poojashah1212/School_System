const User = require("../models/user");
const fs = require("fs");
const csv = require("csv-parser");
const bcrypt = require("bcryptjs");

exports.getStudentById = async (req, res) => {
  try {
    const student = await User.findOne({
      userId: req.params.userId,
      role: "student",
      teacherId: req.user.id
    })
      .select("-password")
      .populate("teacherId", "fullName email");

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
      class: className,
      city,
      state,
      mobileNo
    } = req.body;

    if (!userId || !email || !password) {
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
      city,
      state,
      mobileNo,
      password: hashed,
      class: className,
      teacherId: req.user.id,
      timezone: req.body.timezone || "Asia/Kolkata",
      profileImage: req.file ? `/uploads/${req.file.filename}` : ""
    });

    res.status(201).json(student);
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
      city,
      state,
      class: className,
      timezone
    } = req.body;

    const updateData = {};

    if (fullName) updateData.fullName = fullName.trim();
    if (city) updateData.city = city.trim();
    if (state) updateData.state = state.trim();
    if (className) updateData.class = className;
    if (timezone) updateData.timezone = timezone;
    if (email) {
      const emailExists = await User.findOne({
        email: email.toLowerCase().trim(),
        userId: { $ne: userId }
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
        userId: { $ne: userId }
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

    const student = await User.findOneAndUpdate({userId,role: "student",teacherId },updateData,{ new: true }).select("-password");

    if (!student) {
      return res.status(404).json({
        message: "Student not found or not authorized"
      });
    }

    return res.json({
      message: "Student profile updated successfully",
      student
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Server error"
    });
  }
};

exports.deleteStudent = async (req, res) => {
  await User.findOneAndDelete({
    userId: req.params.userId,
    teacherId: req.user.id
  });

  res.json({ message: "Student deleted" });
};
exports.myProfile = async (req, res) => {
  const user = await User.findById(req.user.id)
    .select("-password")
    .populate("teacherId", "fullName email");

  res.json(user);
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
