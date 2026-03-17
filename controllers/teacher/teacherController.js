const User = require("../../models/user");
const ClassSubject = require("../../models/ClassSubject");
const fs = require("fs");
const csv = require("csv-parser");
const bcrypt = require("bcryptjs");
// const { sendEmail } = require("../utils/emailService");
// const emailTemplates = require("../services/emailTemplates");

exports.getAssignedClasses = async (req, res) => {
  try {
    const teacherId = req.user.id;

    // Find only classes where the teacher is specifically the assigned Class Teacher
    const classes = await ClassSubject.find({
      assignedTeacher: teacherId
    });

    // For each class, filter only the subjects assigned to this teacher
    const assignedData = classes.map(cls => {
      const classObj = cls.toObject();
      const isClassTeacher = classObj.assignedTeacher && classObj.assignedTeacher.toString() === teacherId;
      
      const teacherSubjects = classObj.subjects.filter(sub => 
        sub.assignedTeacher && sub.assignedTeacher.toString() === teacherId
      );

      return {
        _id: classObj._id,
        name: classObj.name,
        grade: classObj.grade,
        isClassTeacher,
        subjects: teacherSubjects,
        totalSubjectsInClass: classObj.subjects.length
      };
    });

    res.status(200).json({
      success: true,
      data: assignedData
    });
  } catch (err) {
    console.error("Error fetching assigned classes:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.getStudentById = async (req, res) => {
  try {
    const studentId = req.params.userId;
    const teacherId = req.user.id;
    let student = null;
    
    // First try by MongoDB _id
    if (studentId.match(/^[0-9a-fA-F]{24}$/)) {
      student = await User.findOne({ _id: studentId, role: "student" })
        .select("-password")
        .populate("teacherId", "fullName email");
    }
    
    // If not found by _id, try by userId field
    if (!student) {
      student = await User.findOne({ userId: studentId, role: "student" })
        .select("-password")
        .populate("teacherId", "fullName email");
    }

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // Check if teacher has permission (Created them OR is their class/subject teacher)
    const isOwner = student.teacherId && student.teacherId._id.toString() === teacherId;
    const isAssigned = await ClassSubject.exists({
      grade: student.class,
      $or: [
        { assignedTeacher: teacherId },
        { "subjects.assignedTeacher": teacherId }
      ]
    });

    if (!isOwner && !isAssigned) {
      return res.status(403).json({ message: "Unauthorized access to student profile" });
    }

    res.json({
      success: true,
      data: student
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.getMyStudents = async (req, res) => {
  try {
    const teacherId = req.user.id;

    // 1. Find all classes where the teacher is assigned (either Class or Subject teacher)
    const assignedClasses = await ClassSubject.find({
      $or: [
        { assignedTeacher: teacherId },
        { "subjects.assignedTeacher": teacherId }
      ]
    }).select("grade");

    // Get unique grades
    const grades = [...new Set(assignedClasses.map(c => c.grade))];

    // 2. Fetch students matching those grades OR created by this teacher
    const students = await User.find({
      role: "student",
      $or: [
        { class: { $in: grades } },
        { teacherId: teacherId }
      ]
    }).select("-password").sort({ class: 1, fullName: 1 });

    res.status(200).json({ students });
  } catch (err) {
    console.error("Error in getMyStudents:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.createStudent = async (req, res) => {
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

    const totalStudents = await User.countDocuments({
      role: "student",
      teacherId: req.user.id
    });

    // Email functionality commented out
    // try {
    //   const teacher = await User.findById(req.user.id).select('fullName email');
    //   console.log('Teacher found for email:', teacher ? teacher.email : 'NOT FOUND');
    //   
    //   if (teacher) {
    //     try {
    //       console.log('Sending student welcome email to:', student.email);
    //       const studentEmailResult = await sendEmail({
    //         to: student.email,
    //         subject: emailTemplates.student_welcome.subject,
    //         html: emailTemplates.student_welcome.html(student.fullName, teacher.fullName, teacher.email, student.email, password)
    //       });
    //       console.log('Student email sent successfully to:', student.email);
    //       
    //       // Add delay to avoid rate limiting
    //       await new Promise(resolve => setTimeout(resolve, 1000));
    //     } catch (studentEmailError) {
    //       console.error('Student email failed:', studentEmailError);
    //     }
    //     
    //     try {
    //       console.log('Sending teacher notification email to:', teacher.email);
    //       await new Promise(resolve => setTimeout(resolve, 500));
    //       const teacherEmailResult = await sendEmail({
    //         to: teacher.email,
    //         subject: emailTemplates.student_added.subject,
    //         html: emailTemplates.student_added.html(teacher.fullName, student.fullName, student.email)
    //       });
    //       console.log('Teacher email sent successfully to:', teacher.email);
    //     } catch (teacherEmailError) {
    //       console.error('Teacher email failed:', teacherEmailError);
    //     }
    //   }
    // } catch (emailError) {
    //   console.error('Email sending process failed:', emailError);
    // }

    res.status(201).json({
      success: true,
      message: "Student created successfully",
      data: student,
      totalStudents: totalStudents
    });
  } catch (err) {
    console.error("CREATE STUDENT ERROR:", err);
    res.status(500).json({ success: false, message: "Server error" });
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

    let student = await User.findOne({ 
      $or: [
        { _id: userId.match(/^[0-9a-fA-F]{24}$/) ? userId : null }, 
        { userId: userId }
      ].filter(q => q !== null),
      role: "student" 
    });

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // Check if teacher has permission
    const isOwner = student.teacherId && student.teacherId.toString() === teacherId;
    const isAssigned = await ClassSubject.exists({
      grade: student.class,
      $or: [
        { assignedTeacher: teacherId },
        { "subjects.assignedTeacher": teacherId }
      ]
    });

    if (!isOwner && !isAssigned) {
      return res.status(403).json({ message: "You do not have permission to update this student" });
    }

    // Perform update
    student = await User.findByIdAndUpdate(student._id, updateData, { new: true }).select("-password");

    // Get updated student count
    const totalStudents = await User.countDocuments({
      role: "student",
      teacherId: teacherId
    });

    return res.json({
      success: true,
      message: "Student profile updated successfully",
      data: student,
      totalStudents: totalStudents
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

exports.deleteStudent = async (req, res) => {
  try {
    const teacherId = req.user.id;
    const studentId = req.params.userId;
    
    // Try to find the student
    let student = await User.findOne({ 
      $or: [
        { _id: studentId.match(/^[0-9a-fA-F]{24}$/) ? studentId : null }, 
        { userId: studentId }
      ].filter(q => q !== null),
      role: "student" 
    });

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // Check if teacher has permission
    const isOwner = student.teacherId && student.teacherId.toString() === teacherId;
    const isAssigned = await ClassSubject.exists({
      grade: student.class,
      $or: [
        { assignedTeacher: teacherId },
        { "subjects.assignedTeacher": teacherId }
      ]
    });

    if (!isOwner && !isAssigned) {
      return res.status(403).json({ message: "You do not have permission to delete this student" });
    }

    const deletedStudent = await User.findByIdAndDelete(student._id);

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
      $or: [{ userId }, { email }],
      role: "student",
      teacherId: teacherId
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

      const student = await User.create({
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

      // Email functionality commented out for CSV upload
      // try {
      //   const teacher = await User.findById(teacherId).select('fullName email');
      //   
      //   if (teacher) {
      //     const studentEmailResult = await sendEmail({
      //       to: student.email,
      //       subject: emailTemplates.student_welcome.subject,
      //       html: emailTemplates.student_welcome.html(student.fullName, teacher.fullName, teacher.email, student.email, password)
      //     });
      //     
      //     // Add delay to avoid rate limiting (1 second delay between students)
      //     await new Promise(resolve => setTimeout(resolve, 1000));
      //     
      //     // Also send notification to teacher for CSV uploads
      //     try {
      //       const teacherEmailResult = await sendEmail({
      //         to: teacher.email,
      //         subject: emailTemplates.student_added.subject,
      //         html: emailTemplates.student_added.html(teacher.fullName, student.fullName, student.email)
      //       });
      //     } catch (teacherEmailError) {
      //       // Continue even if teacher email fails
      //     }
      //   }
      // } catch (emailError) {
      //   // Email errors should not affect student creation
      // }

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
