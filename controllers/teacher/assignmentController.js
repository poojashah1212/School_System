const Assignment = require("../../models/Assignment");
const ClassSubject = require("../../models/ClassSubject");
const User = require("../../models/user");
const path = require("path");
const fs = require("fs");

// Create new assignment
exports.createAssignment = async (req, res) => {
    try {
        const { title, description, classId, subject, deadline } = req.body;
        const teacherId = req.user.id;
        
        // Handle file upload
        let fileUrl = "";
        if (req.file) {
            fileUrl = `/uploads/assignments/${req.file.filename}`;
        }

        const newAssignment = new Assignment({
            title,
            description,
            class: classId,
            subject,
            deadline,
            fileUrl,
            teacher: teacherId
        });

        await newAssignment.save();

        res.status(201).json({
            success: true,
            message: "Assignment created successfully",
            data: newAssignment
        });
    } catch (err) {
        console.error("Error creating assignment:", err);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// Get all assignments for the logged-in teacher
exports.getAssignments = async (req, res) => {
    try {
        const teacherId = req.user.id;
        const assignments = await Assignment.find({ teacher: teacherId })
            .populate("class", "name grade")
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            data: assignments
        });
    } catch (err) {
        console.error("Error fetching assignments:", err);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// Update assignment
exports.updateAssignment = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, classId, subject, deadline } = req.body;
        const teacherId = req.user.id;

        let assignment = await Assignment.findOne({ _id: id, teacher: teacherId });
        if (!assignment) {
            return res.status(404).json({ success: false, message: "Assignment not found or unauthorized" });
        }

        assignment.title = title || assignment.title;
        assignment.description = description || assignment.description;
        assignment.class = classId || assignment.class;
        assignment.subject = subject || assignment.subject;
        assignment.deadline = deadline || assignment.deadline;

        if (req.file) {
            // Delete old file if exists
            if (assignment.fileUrl) {
                const oldPath = path.join(__dirname, "../../", assignment.fileUrl);
                if (fs.existsSync(oldPath)) {
                    fs.unlinkSync(oldPath);
                }
            }
            assignment.fileUrl = `/uploads/assignments/${req.file.filename}`;
        }

        await assignment.save();

        res.status(200).json({
            success: true,
            message: "Assignment updated successfully",
            data: assignment
        });
    } catch (err) {
        console.error("Error updating assignment:", err);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// Delete assignment
exports.deleteAssignment = async (req, res) => {
    try {
        const { id } = req.params;
        const teacherId = req.user.id;

        const assignment = await Assignment.findOne({ _id: id, teacher: teacherId });
        if (!assignment) {
            return res.status(404).json({ success: false, message: "Assignment not found or unauthorized" });
        }

        // Delete file if exists
        if (assignment.fileUrl) {
            const filePath = path.join(__dirname, "../../", assignment.fileUrl);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }

        await Assignment.deleteOne({ _id: id });

        res.status(200).json({
            success: true,
            message: "Assignment deleted successfully"
        });
    } catch (err) {
        console.error("Error deleting assignment:", err);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// Get submissions for a teacher's assignments, including pending students
exports.getSubmissions = async (req, res) => {
    try {
        const teacherId = req.user.id;
        const assignments = await Assignment.find({ teacher: teacherId })
            .populate("submissions.student", "fullName rollNumber")
            .populate("class", "name grade");

        let allSubmissions = [];
        
        for (const assign of assignments) {
            const submittedStudentIds = assign.submissions.map(sub => 
                sub.student ? sub.student._id.toString() : null
            ).filter(id => id !== null);

            // Fetch all students in this class to identify pending ones
            // Some systems use grade, some use class ID. Based on Material.js ref, we might need class ID.
            // But User model has 'class' as String.
            const classStudents = await User.find({
                role: "student",
                class: assign.class.grade
            }).select("fullName userId"); // Using userId as it's more specific than rollNumber in this schema

            // Add actual submissions
            assign.submissions.forEach(sub => {
                allSubmissions.push({
                    assignmentId: assign._id,
                    assignmentTitle: assign.title,
                    class: assign.class,
                    studentId: sub.student ? sub.student._id : null,
                    studentName: sub.student ? sub.student.fullName : "Unknown",
                    submissionDate: sub.submissionDate,
                    status: "Submitted", // Requirement: "Submitted"
                    marks: sub.marks,
                    feedback: sub.feedback,
                    fileUrl: sub.fileUrl,
                    submissionId: sub._id
                });
            });

            // Add pending students
            classStudents.forEach(student => {
                if (!submittedStudentIds.includes(student._id.toString())) {
                    allSubmissions.push({
                        assignmentId: assign._id,
                        assignmentTitle: assign.title,
                        class: assign.class,
                        studentName: student.fullName,
                        submissionDate: null,
                        status: "Pending", // Requirement: "Pending"
                        marks: null,
                        feedback: null,
                        fileUrl: null,
                        submissionId: null
                    });
                }
            });
        }

        res.status(200).json({
            success: true,
            data: allSubmissions
        });
    } catch (err) {
        console.error("Error fetching submissions:", err);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// Evaluate submission
exports.evaluateSubmission = async (req, res) => {
    try {
        const { assignmentId, submissionId } = req.params;
        const { marks, feedback } = req.body;
        const teacherId = req.user.id;

        const assignment = await Assignment.findOne({ _id: assignmentId, teacher: teacherId });
        if (!assignment) {
            return res.status(404).json({ success: false, message: "Assignment not found" });
        }

        const submission = assignment.submissions.id(submissionId);
        if (!submission) {
            return res.status(404).json({ success: false, message: "Submission not found" });
        }

        submission.marks = marks;
        submission.feedback = feedback;
        submission.status = "Evaluated";

        await assignment.save();

        res.status(200).json({
            success: true,
            message: "Submission evaluated successfully",
            data: submission
        });
    } catch (err) {
        console.error("Error evaluating submission:", err);
        res.status(500).json({ success: false, message: "Server error" });
    }
};
