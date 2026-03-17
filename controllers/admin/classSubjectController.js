const ClassSubject = require("../../models/ClassSubject");

// Predefined subjects for different grade levels
const PREDEFINED_SUBJECTS = {
    primary: [
        { name: "Mathematics", code: "MATH-PRI", credits: 4 },
        { name: "English", code: "ENG-PRI", credits: 4 },
        { name: "Science", code: "SCI-PRI", credits: 3 },
        { name: "Social Studies", code: "SOC-PRI", credits: 3 },
        { name: "Art", code: "ART-PRI", credits: 2 }
    ],
    secondary: [
        { name: "Advanced Mathematics", code: "MATH-SEC", credits: 5 },
        { name: "English Literature", code: "ENG-SEC", credits: 4 },
        { name: "Physics", code: "PHY-SEC", credits: 4 },
        { name: "Chemistry", code: "CHE-SEC", credits: 4 },
        { name: "Computer Science", code: "CS-SEC", credits: 4 }
    ]
};

// Auto-seed classes 1 to 12
exports.autoSeedClasses = async () => {
    try {
        console.log("Checking for missing classes from Grade 1 to 12...");
        
        for (let i = 1; i <= 12; i++) {
            const gradeStr = i.toString();
            const existingClass = await ClassSubject.findOne({ grade: gradeStr });
            
            if (!existingClass) {
                console.log(`Seeding missing Grade ${i}...`);
                const isPrimary = i <= 8;
                const subjects = isPrimary ? PREDEFINED_SUBJECTS.primary : PREDEFINED_SUBJECTS.secondary;
                
                await ClassSubject.create({
                    name: `Grade ${i}`,
                    grade: gradeStr,
                    subjects: subjects
                });
            }
        }
        console.log("Class seeding check completed.");
    } catch (err) {
        console.error("Error seeding classes:", err);
    }
};

exports.seedClasses = async (req, res) => {
    await exports.autoSeedClasses();
    res.status(200).json({ success: true, message: "Seed triggered" });
};

exports.getClasses = async (req, res) => {
    try {
        const classes = await ClassSubject.find();
        res.status(200).json({
            success: true,
            data: classes
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.updateClass = async (req, res) => {
    try {
        const updatedClass = await ClassSubject.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!updatedClass) {
            return res.status(404).json({ success: false, message: "Class not found" });
        }

        res.status(200).json({ success: true, data: updatedClass });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.deleteClass = async (req, res) => {
    try {
        const deletedClass = await ClassSubject.findByIdAndDelete(req.params.id);
        if (!deletedClass) {
            return res.status(404).json({ success: false, message: "Class not found" });
        }
        res.status(200).json({ success: true, message: "Class deleted" });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// Subject Management within a Class
exports.updateSubject = async (req, res) => {
    try {
        const { classId, subjectId } = req.params;
        const { name, code, credits } = req.body;

        const classDoc = await ClassSubject.findById(classId);
        if (!classDoc) {
            return res.status(404).json({ success: false, message: "Class not found" });
        }

        const subject = classDoc.subjects.id(subjectId);
        if (!subject) {
            return res.status(404).json({ success: false, message: "Subject not found" });
        }

        if (name) subject.name = name;
        if (code) subject.code = code;
        if (credits) subject.credits = credits;

        await classDoc.save();
        res.status(200).json({ success: true, data: classDoc });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.deleteSubject = async (req, res) => {
    try {
        const { classId, subjectId } = req.params;

        const classDoc = await ClassSubject.findById(classId);
        if (!classDoc) {
            return res.status(404).json({ success: false, message: "Class not found" });
        }

        classDoc.subjects.pull({ _id: subjectId });
        await classDoc.save();

        res.status(200).json({ success: true, message: "Subject deleted", data: classDoc });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.getSubjects = async (req, res) => {
    try {
        const classes = await ClassSubject.find();
        let allSubjects = [];
        classes.forEach(c => {
            c.subjects.forEach(s => {
                allSubjects.push({
                    ...s.toObject(),
                    className: c.name,
                    classGrade: c.grade,
                    classId: c._id
                });
            });
        });
        res.status(200).json({ success: true, data: allSubjects });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.addSubject = async (req, res) => {
    try {
        const { classId } = req.params;
        const { name, code, credits } = req.body;

        const classDoc = await ClassSubject.findById(classId);
        if (!classDoc) {
            return res.status(404).json({ success: false, message: "Class not found" });
        }

        classDoc.subjects.push({ name, code, credits: Number(credits) });
        await classDoc.save();

        res.status(201).json({ success: true, data: classDoc });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
