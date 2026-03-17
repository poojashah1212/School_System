const Announcement = require("../../models/Announcement");
const User = require("../../models/user");

const createAnnouncement = async (req, res) => {
    try {
        const { title, content, targetAudience, targetClass, category } = req.body;

        if (!title || !content) {
            return res.status(400).json({ message: "Title and content are required" });
        }

        // If teacher is posting, they can target a specific class or students in general
        let audience = targetAudience || 'all';
        if (req.user.role === 'teacher') {
            audience = targetClass ? 'class' : 'students';
        }

        const announcement = await Announcement.create({
            title,
            content,
            targetAudience: audience,
            targetClass: targetClass || null,
            category: category || 'General',
            author: req.user.id
        });

        res.status(201).json({
            success: true,
            data: announcement
        });
    } catch (error) {
        console.error("Error creating announcement:", error);
        res.status(500).json({ message: "Server error while creating announcement" });
    }
};

const getAnnouncements = async (req, res) => {
    try {
        let query = {};
        
        // Role-based visibility
        if (req.user.role === 'teacher') {
            // Teachers see: 
            // 1. Announcements aimed at 'all' or 'teachers'
            // 2. Announcements they authored
            query = {
                $or: [
                    { targetAudience: { $in: ['all', 'teachers'] } },
                    { author: req.user.id }
                ]
            };
        } else if (req.user.role === 'student') {
            // Students see:
            // 1. Announcements aimed at 'all' or 'students'
            // 2. Announcements aimed at their specific class (if student.class matches grade)
            // Wait, student.class is a string (grade). targetClass in Announcement is ObjectId.
            // We need to find the ClassSubject by grade first, or store grade in Announcement.
            
            // For now, let's assume we want to match by classId if we can, 
            // but the student model has 'class' as a string.
            // Let's check how students are linked to classes.
            
            const student = await User.findById(req.user.id);
            const studentGrade = student.class;

            // Find the ClassSubject ID for this grade
            const ClassSubject = require("../../models/ClassSubject");
            const classObj = await ClassSubject.findOne({ grade: studentGrade });

            query = {
                $or: [
                    { targetAudience: { $in: ['all', 'students'] } },
                    { 
                        targetAudience: 'class', 
                        targetClass: classObj ? classObj._id : null 
                    }
                ]
            };
        }
        // Admin (default) sees everything

        const announcements = await Announcement.find(query)
            .populate("author", "fullName email")
            .populate("targetClass", "grade name")
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: announcements.length,
            data: announcements
        });
    } catch (error) {
        console.error("Error fetching announcements:", error);
        res.status(500).json({ message: "Server error while fetching announcements" });
    }
};

const deleteAnnouncement = async (req, res) => {
    try {
        const announcement = await Announcement.findById(req.params.id);

        if (!announcement) {
            return res.status(404).json({ message: "Announcement not found" });
        }

        // Only author or admin can delete
        if (req.user.role !== 'admin' && announcement.author.toString() !== req.user.id) {
            return res.status(403).json({ message: "Not authorized to delete this announcement" });
        }

        await announcement.deleteOne();

        res.status(200).json({
            success: true,
            message: "Announcement removed"
        });
    } catch (error) {
        console.error("Error deleting announcement:", error);
        res.status(500).json({ message: "Server error while deleting announcement" });
    }
};

module.exports = {
    createAnnouncement,
    getAnnouncements,
    deleteAnnouncement
};
