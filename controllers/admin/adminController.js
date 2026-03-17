const User = require("../../models/user");

exports.getTeachers = async (req, res) => {
  try {
    const teachers = await User.find({ role: "teacher" }).select("-password");

    res.status(200).json({
      success: true,
      count: teachers.length,
      data: teachers
    });
  } catch (err) {
    console.error("Error fetching teachers:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch teachers"
    });
  }
};

exports.deleteTeacher = async (req, res) => {
  try {
    const { id } = req.params;

    const teacher = await User.findById(id);

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: "Teacher not found"
      });
    }

    if (teacher.role !== "teacher") {
      return res.status(400).json({
        success: false,
        message: "User is not a teacher"
      });
    }

    await User.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Teacher deleted successfully"
    });
  } catch (err) {
    console.error("Error deleting teacher:", err);
    res.status(500).json({
      success: false,
      message: "Failed to delete teacher"
    });
  }
};

exports.updateTeacher = async (req, res) => {
  try {
    const { id } = req.params;
    const { fullName, email, mobileNo, city, state, subject } = req.body;

    const teacher = await User.findById(id);

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: "Teacher not found"
      });
    }

    if (teacher.role !== "teacher") {
      return res.status(400).json({
        success: false,
        message: "User is not a teacher"
      });
    }

    const updateData = {};
    if (fullName) updateData.fullName = fullName;
    if (email) updateData.email = email;
    if (mobileNo) updateData.mobileNo = mobileNo;
    if (city) updateData.city = city;
    if (state) updateData.state = state;
    if (subject) updateData.subject = subject;

    const updatedTeacher = await User.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).select("-password");

    res.status(200).json({
      success: true,
      message: "Teacher updated successfully",
      data: updatedTeacher
    });
  } catch (err) {
    console.error("Error updating teacher:", err);
    res.status(500).json({
      success: false,
      message: "Failed to update teacher"
    });
  }
};

// Student Management Functions
exports.getStudents = async (req, res) => {
  try {
    const students = await User.find({ role: "student" }).select("-password");

    res.status(200).json({
      success: true,
      count: students.length,
      data: students
    });
  } catch (err) {
    console.error("Error fetching students:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch students"
    });
  }
};

exports.deleteStudent = async (req, res) => {
  try {
    const { id } = req.params;

    const student = await User.findById(id);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found"
      });
    }

    if (student.role !== "student") {
      return res.status(400).json({
        success: false,
        message: "User is not a student"
      });
    }

    await User.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Student deleted successfully"
    });
  } catch (err) {
    console.error("Error deleting student:", err);
    res.status(500).json({
      success: false,
      message: "Failed to delete student"
    });
  }
};

exports.updateStudent = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if req.body exists
    if (!req.body) {
      return res.status(400).json({
        success: false,
        message: "Request body is required"
      });
    }
    
    const { fullName, email, mobileNo, city, state, class: studentClass, age, userId } = req.body;

    const student = await User.findById(id);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found"
      });
    }

    if (student.role !== "student") {
      return res.status(400).json({
        success: false,
        message: "User is not a student"
      });
    }

    const updateData = {};
    if (fullName) updateData.fullName = fullName;
    if (email) updateData.email = email;
    if (mobileNo) updateData.mobileNo = mobileNo;
    if (city) updateData.city = city;
    if (state) updateData.state = state;
    if (studentClass) updateData.class = studentClass;
    if (age) updateData.age = age;
    if (userId) updateData.userId = userId;

    const updatedStudent = await User.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).select("-password");

    res.status(200).json({
      success: true,
      message: "Student updated successfully",
      data: updatedStudent
    });
  } catch (err) {
    console.error("Error updating student:", err);
    res.status(500).json({
      success: false,
      message: "Failed to update student"
    });
  }
};
