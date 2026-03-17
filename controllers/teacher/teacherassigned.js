const User = require("../../models/user");
const ClassSubject = require("../../models/ClassSubject");
const Session = require("../../models/Session");

// Get all classes and subjects assigned to the logged-in teacher (Class Teacher or Subject Teacher)
exports.getAssignedClasses = async (req, res) => {
  try {
    const teacherId = req.user.id;

    // Find classes where teacher is the primary Class Teacher OR teaches any subject
    const classes = await ClassSubject.find({
      $or: [
        { assignedTeacher: teacherId },
        { "subjects.assignedTeacher": teacherId }
      ]
    });

    const assignedData = await Promise.all(classes.map(async (cls) => {
      const classObj = cls.toObject();
      const isClassTeacher = classObj.assignedTeacher && classObj.assignedTeacher.toString() === teacherId;

      // Filter subjects that this teacher specifically teaches
      const teacherSubjects = classObj.subjects.filter(sub =>
        sub.assignedTeacher && sub.assignedTeacher.toString() === teacherId
      );

      // Count students in this class/grade
      const studentCount = await User.countDocuments({
        role: "student",
        class: classObj.grade
      });

      return {
        _id: classObj._id,
        name: classObj.name,
        grade: classObj.grade,
        section: classObj.name.split('-')[1] || "A",
        isClassTeacher,
        subjects: teacherSubjects.map(s => s.name),
        studentCount,
        totalSubjectsInClass: classObj.subjects.length
      };
    }));

    res.status(200).json({
      success: true,
      data: assignedData
    });
  } catch (err) {
    console.error("Error fetching assigned classes:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Get students for a specific assigned class
exports.getClassStudents = async (req, res) => {
  try {
    const { classId } = req.params;
    const teacherId = req.user.id;

    // Verify the teacher is either Class Teacher or Subject Teacher for this specific class
    const classInfo = await ClassSubject.findOne({
      _id: classId,
      $or: [
        { assignedTeacher: teacherId },
        { "subjects.assignedTeacher": teacherId }
      ]
    });

    if (!classInfo) {
      return res.status(403).json({ success: false, message: "Access denied. You are not assigned to this class." });
    }

    const students = await User.find({
      role: "student",
      class: classInfo.grade
    }).select("-password");

    res.status(200).json({
      success: true,
      data: students,
      className: classInfo.name,
      grade: classInfo.grade
    });
  } catch (err) {
    console.error("Error fetching class students:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Get all students from all classes where the teacher is involved
exports.getAllAssignedStudents = async (req, res) => {
  try {
    const teacherId = req.user.id;

    // 1. Find all classes where the teacher is involved
    const assignedClasses = await ClassSubject.find({
      $or: [
        { assignedTeacher: teacherId },
        { "subjects.assignedTeacher": teacherId }
      ]
    }).select("grade name");

    if (assignedClasses.length === 0) {
      return res.status(200).json({
        success: true,
        data: [],
        message: "No assigned classes found"
      });
    }

    // Get unique grades
    const grades = [...new Set(assignedClasses.map(c => c.grade))];

    // 2. Fetch students matching those grades
    const students = await User.find({
      role: "student",
      class: { $in: grades }
    }).select("-password").sort({ class: 1, fullName: 1 });

    res.status(200).json({
      success: true,
      data: students
    });
  } catch (err) {
    console.error("Error fetching all assigned students:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Get ALL timetable entries (weekly routine) for the logged-in teacher across all classes
exports.getAllTimetables = async (req, res) => {
  try {
    const teacherId = req.user.id;

    // Find all classes
    const classes = await ClassSubject.find({
      $or: [
        { assignedTeacher: teacherId },
        { "subjects.assignedTeacher": teacherId },
        { "timetable.teacherId": teacherId }
      ]
    }).select("name grade timetable");

    // Flatten and filter timetable entries for this teacher
    const teacherTimetable = [];
    classes.forEach(cls => {
      if (cls.timetable && cls.timetable.length > 0) {
        cls.timetable.forEach(entry => {
          // Check if teacher is the one in the entry
          // Some might be by ID, some might be by name? (The model says teacherId is String)
          if (entry.teacherId === teacherId) {
            teacherTimetable.push({
              ...entry.toObject(),
              className: cls.name,
              grade: cls.grade,
              classId: cls._id,
              dayName: entry.day, // Use the day string from the entry
              title: `${entry.subjectName} (${cls.name})`
            });
          }
        });
      }
    });

    res.status(200).json({
      success: true,
      data: teacherTimetable
    });
  } catch (err) {
    console.error("Error fetching all timetables:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Get sessions for a specific class (Class Timetable)
exports.getClassTimetable = async (req, res) => {
  try {
    const { classId } = req.params;
    const teacherId = req.user.id;

    // Verify teacher is involved with this class
    const classInfo = await ClassSubject.findOne({
      _id: classId,
      $or: [
        { assignedTeacher: teacherId },
        { "subjects.assignedTeacher": teacherId }
      ]
    });

    if (!classInfo) {
      return res.status(403).json({ success: false, message: "Access denied. You are not assigned to this class timetable." });
    }

    // Map the timetable array to a consistent format
    const formattedTimetable = (classInfo.timetable || []).map(entry => ({
      ...entry.toObject(),
      dayName: entry.day,
      title: entry.subjectName,
      teacherId: entry.teacherId,
      teacherName: entry.teacherName
    }));

    res.status(200).json({
      success: true,
      data: formattedTimetable
    });
  } catch (err) {
    console.error("Error fetching class timetable:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
