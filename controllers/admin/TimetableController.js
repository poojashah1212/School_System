const ClassSubject = require("../../models/ClassSubject");
const User = require("../../models/user");
const moment = require("moment");

exports.generateTimetable = async (req, res) => {
    try {
        const { classId, startTime, endTime, duration } = req.body;

        if (!classId || !startTime || !endTime || !duration) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields: classId, startTime, endTime, duration"
            });
        }

        const classDoc = await ClassSubject.findById(classId)
            .populate("subjects.assignedTeacher", "fullName userId email");
        if (!classDoc) {
            return res.status(404).json({ success: false, message: "Class not found" });
        }

        const subjects = classDoc.subjects;

        if (!subjects || subjects.length === 0) {
            return res.status(400).json({
                success: false,
                message: "No subjects found for this class. Please add subjects first."
            });
        }

        // Validation 1: All subjects must have a teacher assigned
        const missingTeachers = subjects.filter(s => !s.assignedTeacher);
        if (missingTeachers.length > 0) {
            let msg = "";
            if (missingTeachers.length === subjects.length) {
                msg = "Teacher assignment pending for all subjects. Please assign teachers before generating the timetable.";
            } else if (missingTeachers.length === 1) {
                msg = `Teacher assignment pending for ${missingTeachers[0].name}. Please assign a teacher before generating the timetable.`;
            } else {
                msg = "Teacher assignment pending for multiple subjects. Please assign teachers before generating the timetable.";
            }
            return res.status(400).json({ success: false, message: msg });
        }

        // Parse times using moment
        const start = moment(startTime, "HH:mm");
        const end = moment(endTime, "HH:mm");
        const periodDuration = parseInt(duration);

        if (!start.isValid() || !end.isValid()) {
            return res.status(400).json({ success: false, message: "Invalid time format. Use HH:mm (e.g., 08:00)" });
        }

        if (start.isSameOrAfter(end)) {
            return res.status(400).json({ success: false, message: "Start time must be before end time" });
        }

        // Calculate slots per day
        let slotsPerDay = [];
        let current = start.clone();

        while (current.clone().add(periodDuration, 'minutes').isSameOrBefore(end)) {
            slotsPerDay.push({
                start: current.format("HH:mm"),
                end: current.clone().add(periodDuration, 'minutes').format("HH:mm")
            });
            current.add(periodDuration, 'minutes');
        }

        if (slotsPerDay.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Duration is too long for the given time range"
            });
        }

        const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

        // Conflict Detection: Build a map of busy teachers across other classes
        const otherClasses = await ClassSubject.find({ _id: { $ne: classId } });
        const busyMap = {}; // day -> slotStart -> Set(teacherIds)

        otherClasses.forEach(c => {
            if (c.timetable && c.timetable.length > 0) {
                c.timetable.forEach(entry => {
                    if (!busyMap[entry.day]) busyMap[entry.day] = {};
                    if (!busyMap[entry.day][entry.startTime]) busyMap[entry.day][entry.startTime] = new Set();
                    if (entry.teacherId) busyMap[entry.day][entry.startTime].add(entry.teacherId);
                });
            }
        });

        let timetable = [];

        // Distribution logic: Track subject usage to keep it balanced
        const subjectStats = subjects.map(s => ({
            ...s.toObject(),
            count: 0
        }));

        days.forEach(day => {
            slotsPerDay.forEach(slot => {
                // Find a subject whose teacher is not busy in this slot
                // Sort by least used subjects first to stay balanced
                subjectStats.sort((a, b) => a.count - b.count);

                let assigned = false;
                for (let i = 0; i < subjectStats.length; i++) {
                    const s = subjectStats[i];
                    // Use the populated fields correctly
                    const tId = s.assignedTeacher._id.toString();

                    const isBusy = busyMap[day] && busyMap[day][slot.start] && busyMap[day][slot.start].has(tId);

                    if (!isBusy) {
                        timetable.push({
                            day,
                            startTime: slot.start,
                            endTime: slot.end,
                            subjectName: s.name,
                            subjectCode: s.code,
                            teacherName: s.assignedTeacher.fullName,
                            teacherId: tId
                        });
                        s.count++;
                        assigned = true;
                        break;
                    }
                }

                // Absolute fallback (rarely reachable if teacher pool is sufficient)
                if (!assigned) {
                    const s = subjectStats[0];
                    timetable.push({
                        day,
                        startTime: slot.start,
                        endTime: slot.end,
                        subjectName: s.name,
                        subjectCode: s.code,
                        teacherName: s.assignedTeacher.fullName,
                        teacherId: s.assignedTeacher._id.toString()
                    });
                    s.count++;
                }
            });
        });

        // Save generated timetable to the class document
        classDoc.timetable = timetable;
        await classDoc.save();

        res.status(200).json({
            success: true,
            message: `Successfully generated timetable with ${slotsPerDay.length} periods per day.`,
            data: timetable
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get timetable for a specific class
exports.getClassTimetable = async (req, res) => {
    try {
        const { classId } = req.params;
        
        const classDoc = await ClassSubject.findById(classId)
            .populate("subjects.assignedTeacher", "fullName userId email");
            
        if (!classDoc) {
            return res.status(404).json({ success: false, message: "Class not found" });
        }

        res.status(200).json({
            success: true,
            data: {
                timetable: classDoc.timetable || [],
                subjects: classDoc.subjects
            }
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get subjects for a class (for timetable editing)
exports.getClassSubjects = async (req, res) => {
    try {
        const { classId } = req.params;
        
        const classDoc = await ClassSubject.findById(classId)
            .populate("subjects.assignedTeacher", "fullName userId email");
            
        if (!classDoc) {
            return res.status(404).json({ success: false, message: "Class not found" });
        }

        res.status(200).json({
            success: true,
            data: classDoc.subjects
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Update timetable session
exports.updateSession = async (req, res) => {
    try {
        const { sessionId } = req.params;
        const { day, startTime, endTime, subjectName, subjectCode, teacherName, teacherId } = req.body;
        
        const classDoc = await ClassSubject.findOne({ "timetable._id": sessionId });
        
        if (!classDoc) {
            return res.status(404).json({ success: false, message: "Session not found" });
        }

        // Update the specific session in the timetable array
        const sessionIndex = classDoc.timetable.findIndex(session => session._id.toString() === sessionId);
        if (sessionIndex === -1) {
            return res.status(404).json({ success: false, message: "Session not found" });
        }

        classDoc.timetable[sessionIndex] = {
            ...classDoc.timetable[sessionIndex],
            day,
            startTime,
            endTime,
            subjectName,
            subjectCode,
            teacherName,
            teacherId
        };

        await classDoc.save();

        res.status(200).json({
            success: true,
            message: "Session updated successfully",
            data: classDoc.timetable[sessionIndex]
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Delete timetable session
exports.deleteSession = async (req, res) => {
    try {
        const { sessionId } = req.params;
        
        const classDoc = await ClassSubject.findOne({ "timetable._id": sessionId });
        
        if (!classDoc) {
            return res.status(404).json({ success: false, message: "Session not found" });
        }

        // Remove the session from the timetable array
        classDoc.timetable = classDoc.timetable.filter(session => session._id.toString() !== sessionId);
        
        await classDoc.save();

        res.status(200).json({
            success: true,
            message: "Session deleted successfully"
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Generate timetables for all classes
exports.generateAllTimetables = async (req, res) => {
    try {
        const { startTime, endTime, duration } = req.body;

        if (!startTime || !endTime || !duration) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields: startTime, endTime, duration"
            });
        }

        // Get all classes
        const allClasses = await ClassSubject.find()
            .populate("subjects.assignedTeacher", "fullName userId email");

        if (!allClasses || allClasses.length === 0) {
            return res.status(404).json({ success: false, message: "No classes found" });
        }

        const results = [];
        let successCount = 0;
        let failureCount = 0;

        // Generate timetable for each class
        for (const classDoc of allClasses) {
            try {
                // Reuse the same logic as generateTimetable but for each class
                const subjects = classDoc.subjects;
                if (!subjects || subjects.length === 0) {
                    results.push({
                        classId: classDoc._id,
                        className: classDoc.name,
                        success: false,
                        message: "No subjects found for this class"
                    });
                    failureCount++;
                    continue;
                }

                // Check if all subjects have teachers assigned
                const missingTeachers = subjects.filter(s => !s.assignedTeacher);
                if (missingTeachers.length > 0) {
                    results.push({
                        classId: classDoc._id,
                        className: classDoc.name,
                        success: false,
                        message: "Teacher assignment pending for one or more subjects"
                    });
                    failureCount++;
                    continue;
                }

                // Parse times and generate slots (same logic as generateTimetable)
                const start = moment(startTime, "HH:mm");
                const end = moment(endTime, "HH:mm");
                const periodDuration = parseInt(duration);

                if (!start.isValid() || !end.isValid()) {
                    results.push({
                        classId: classDoc._id,
                        className: classDoc.name,
                        success: false,
                        message: "Invalid time format"
                    });
                    failureCount++;
                    continue;
                }

                // Generate timetable logic (simplified version)
                const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
                let slotsPerDay = [];
                let current = start.clone();

                while (current.clone().add(periodDuration, 'minutes').isSameOrBefore(end)) {
                    slotsPerDay.push({
                        start: current.format("HH:mm"),
                        end: current.clone().add(periodDuration, 'minutes').format("HH:mm")
                    });
                    current.add(periodDuration, 'minutes');
                }

                // Generate timetable for this class
                let timetable = [];
                const subjectStats = subjects.map(s => ({
                    ...s.toObject(),
                    count: 0
                }));

                days.forEach(day => {
                    slotsPerDay.forEach(slot => {
                        subjectStats.sort((a, b) => a.count - b.count);
                        const s = subjectStats[0];
                        
                        timetable.push({
                            day,
                            startTime: slot.start,
                            endTime: slot.end,
                            subjectName: s.name,
                            subjectCode: s.code,
                            teacherName: s.assignedTeacher.fullName,
                            teacherId: s.assignedTeacher.userId
                        });
                        s.count++;
                    });
                });

                // Save timetable
                classDoc.timetable = timetable;
                await classDoc.save();

                results.push({
                    classId: classDoc._id,
                    className: classDoc.name,
                    success: true,
                    message: "Timetable generated successfully",
                    periodsPerDay: slotsPerDay.length
                });
                successCount++;

            } catch (error) {
                results.push({
                    classId: classDoc._id,
                    className: classDoc.name,
                    success: false,
                    message: error.message
                });
                failureCount++;
            }
        }

        res.status(200).json({
            success: true,
            message: `Generated timetables for ${successCount} classes successfully. ${failureCount} classes failed.`,
            results: results
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};