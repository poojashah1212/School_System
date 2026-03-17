const ClassSubject = require("../../models/ClassSubject");
const User = require("../../models/user");

/**
 * Get the weekly timetable for the logged-in student's class
 */
exports.getTimetable = async (req, res) => {
    try {
        const studentId = req.user.id;
        
        // 1. Get student details to find their class/grade
        const student = await User.findById(studentId);
        if (!student || student.role !== 'student') {
            return res.status(404).json({ success: false, message: "Student not found" });
        }

        if (!student.class) {
            return res.status(400).json({ success: false, message: "Student not assigned to any class/grade" });
        }

        // 2. Find the class document matching the student's grade
        // Note: In this system, student.class stores the grade (e.g., "10")
        const classDoc = await ClassSubject.findOne({ grade: student.class });

        if (!classDoc) {
            return res.status(404).json({ success: false, message: `Timetable not found for Grade ${student.class}` });
        }

        // 3. Return the timetable
        res.status(200).json({
            success: true,
            data: classDoc.timetable || [],
            className: classDoc.name,
            grade: classDoc.grade,
            classId: classDoc._id
        });

    } catch (err) {
        console.error("Error fetching student timetable:", err);
        res.status(500).json({ success: false, message: "Server error while fetching timetable" });
    }
};

/**
 * Get all study materials for the logged-in student's class
 */
exports.getMaterials = async (req, res) => {
    try {
        const studentId = req.user.id;
        const Material = require("../../models/Material");

        // 1. Get student to find their grade
        const student = await User.findById(studentId);
        if (!student || student.role !== 'student') {
            return res.status(404).json({ success: false, message: "Student not found" });
        }

        if (!student.class) {
            return res.status(400).json({ success: false, message: "Student not assigned to any class/grade" });
        }

        // 2. Find the class document
        const classDoc = await ClassSubject.findOne({ grade: student.class });
        if (!classDoc) {
            return res.status(404).json({ success: false, message: "Class documentation not found" });
        }

        // 3. Fetch materials for this class
        const materials = await Material.find({ class: classDoc._id })
            .populate("teacher", "fullName")
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            materials,
            className: classDoc.name,
            grade: classDoc.grade
        });

    } catch (err) {
        console.error("Error fetching student materials:", err);
        res.status(500).json({ success: false, message: "Server error while fetching materials" });
    }
};
