const ClassSubject = require("../../models/ClassSubject");
const User = require("../../models/user");

// Get all class assignments with teacher details
exports.getAssignments = async (req, res) => {
    try {
        const assignments = await ClassSubject.find()
            .populate("assignedTeacher", "fullName userId email")
            .sort({ grade: 1 });

        res.status(200).json({
            success: true,
            data: assignments
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// Assign a teacher to a class
exports.assignClass = async (req, res) => {
    try {
        const { classId, teacherId } = req.body;

        if (!classId || !teacherId) {
            return res.status(400).json({ success: false, message: "Class ID and Teacher ID are required" });
        }

        const teacher = await User.findOne({ _id: teacherId, role: "teacher" });
        if (!teacher) {
            return res.status(404).json({ success: false, message: "Teacher not found" });
        }

        const updatedClass = await ClassSubject.findByIdAndUpdate(
            classId,
            {
                assignedTeacher: teacherId,
                assignmentDate: new Date()
            },
            { new: true }
        ).populate("assignedTeacher", "fullName userId email");

        if (!updatedClass) {
            return res.status(404).json({ success: false, message: "Class not found" });
        }

        res.status(200).json({
            success: true,
            message: "Teacher assigned successfully",
            data: updatedClass
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// Unassign teacher from a class
exports.unassignClass = async (req, res) => {
    try {
        const { classId } = req.body;

        if (!classId) {
            return res.status(400).json({ success: false, message: "Class ID is required" });
        }

        const updatedClass = await ClassSubject.findByIdAndUpdate(
            classId,
            {
                assignedTeacher: null,
                assignmentDate: null
            },
            { new: true }
        );

        if (!updatedClass) {
            return res.status(404).json({ success: false, message: "Class not found" });
        }

        res.status(200).json({
            success: true,
            message: "Teacher unassigned successfully",
            data: updatedClass
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// Get all subject assignments
exports.getSubjectAssignments = async (req, res) => {
    try {
        const classes = await ClassSubject.find()
            .populate("subjects.assignedTeacher", "fullName userId email")
            .sort({ grade: 1 });

        // Flatten the subjects with their class context
        const subjectAssignments = [];
        classes.forEach(cls => {
            cls.subjects.forEach(sub => {
                subjectAssignments.push({
                    _id: sub._id,
                    name: sub.name,
                    code: sub.code,
                    credits: sub.credits,
                    assignedTeacher: sub.assignedTeacher,
                    assignmentDate: sub.assignmentDate,
                    classId: cls._id,
                    className: cls.name,
                    classGrade: cls.grade
                });
            });
        });

        res.status(200).json({
            success: true,
            data: subjectAssignments
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// Assign a teacher to a subject
exports.assignSubject = async (req, res) => {
    try {
        const { classId, subjectId, teacherId } = req.body;

        if (!classId || !subjectId || !teacherId) {
            return res.status(400).json({ success: false, message: "Class ID, Subject ID and Teacher ID are required" });
        }

        const teacher = await User.findOne({ _id: teacherId, role: "teacher" });
        if (!teacher) {
            return res.status(404).json({ success: false, message: "Teacher not found" });
        }

        const updatedClass = await ClassSubject.findOneAndUpdate(
            { _id: classId, "subjects._id": subjectId },
            {
                $set: {
                    "subjects.$.assignedTeacher": teacherId,
                    "subjects.$.assignmentDate": new Date()
                }
            },
            { new: true }
        ).populate("subjects.assignedTeacher", "fullName userId email");

        if (!updatedClass) {
            return res.status(404).json({ success: false, message: "Class or Subject not found" });
        }

        const updatedSubject = updatedClass.subjects.id(subjectId);

        res.status(200).json({
            success: true,
            message: "Teacher assigned to subject successfully",
            data: updatedSubject
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// Unassign teacher from a subject
exports.unassignSubject = async (req, res) => {
    try {
        const { classId, subjectId } = req.body;

        if (!classId || !subjectId) {
            return res.status(400).json({ success: false, message: "Class ID and Subject ID are required" });
        }

        const updatedClass = await ClassSubject.findOneAndUpdate(
            { _id: classId, "subjects._id": subjectId },
            {
                $set: {
                    "subjects.$.assignedTeacher": null,
                    "subjects.$.assignmentDate": null
                }
            },
            { new: true }
        );

        if (!updatedClass) {
            return res.status(404).json({ success: false, message: "Class or Subject not found" });
        }

        res.status(200).json({
            success: true,
            message: "Teacher unassigned from subject successfully"
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
