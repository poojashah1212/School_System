const { v4: uuidv4 } = require("uuid");
const ClassSubject = require("../../models/ClassSubject");
const LiveSession = require("../../models/LiveSession");
const User = require("../../models/user");
const zoomService = require("../../services/zoomService");

// Helper to get current day name
function getTodayDayName() {
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  return days[new Date().getDay()];
}

// GET /api/live-session/today-classes
// Returns teacher's timetable entries for today, enriched with live session status
exports.getTodayClasses = async (req, res) => {
  try {
    const teacherId = req.user.id;
    const todayDay = getTodayDayName();
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // Find all classes where teacher is assigned in the timetable
    const classes = await ClassSubject.find({
      $or: [
        { assignedTeacher: teacherId },
        { "subjects.assignedTeacher": teacherId },
        { "timetable.teacherId": teacherId }
      ]
    }).select("name grade timetable");

    // Collect today's timetable entries for this teacher
    const todayEntries = [];
    classes.forEach((cls) => {
      if (cls.timetable && cls.timetable.length > 0) {
        cls.timetable.forEach((entry) => {
          if (
            entry.day === todayDay &&
            entry.teacherId === teacherId
          ) {
            todayEntries.push({
              timetableEntryId: entry._id.toString(),
              classId: cls._id.toString(),
              className: cls.name,
              grade: cls.grade,
              subjectName: entry.subjectName,
              subjectCode: entry.subjectCode,
              startTime: entry.startTime,
              endTime: entry.endTime,
              day: entry.day
            });
          }
        });
      }
    });

    // For each entry, check if there's an active/pending live session today
    const enrichedEntries = await Promise.all(
      todayEntries.map(async (entry) => {
        const existingSession = await LiveSession.findOne({
          teacherId,
          timetableEntryId: entry.timetableEntryId,
          scheduledDate: { $gte: todayStart, $lte: todayEnd },
          status: { $in: ["active", "pending"] }
        });

        return {
          ...entry,
          session: existingSession
            ? {
                _id: existingSession._id,
                meetingLink: existingSession.meetingLink,
                status: existingSession.status,
                startedAt: existingSession.startedAt
              }
            : null
        };
      })
    );

    // Sort by startTime
    enrichedEntries.sort((a, b) => {
      return a.startTime.localeCompare(b.startTime);
    });

    res.status(200).json({
      success: true,
      day: todayDay,
      date: new Date().toLocaleDateString("en-IN", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric"
      }),
      data: enrichedEntries
    });
  } catch (err) {
    console.error("Error fetching today's classes:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// POST /api/live-session/create
// Body: { classId, timetableEntryId, subjectName, className, grade, startTime, endTime }
exports.createSession = async (req, res) => {
  try {
    const teacherId = req.user.id;
    const { classId, timetableEntryId, subjectName, className, grade, startTime, endTime } = req.body;

    if (!classId || !subjectName || !className || !startTime || !endTime) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    // Check if a session already exists for this timetable slot today
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const existing = await LiveSession.findOne({
      teacherId,
      timetableEntryId: timetableEntryId || null,
      classId,
      scheduledDate: { $gte: todayStart, $lte: todayEnd },
      status: { $in: ["active", "pending"] }
    });

    if (existing) {
      return res.status(200).json({
        success: true,
        message: "Session already exists",
        data: existing
      });
    }

    // Calculate meeting duration in minutes
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    const durationMinutes = (endHour * 60 + endMin) - (startHour * 60 + startMin);

    // Create Zoom meeting
    const meetingTopic = `${subjectName} - ${className} (Grade ${grade})`;
    const meetingResult = await zoomService.createMeeting({
      topic: meetingTopic,
      start_time: new Date().toISOString(),
      duration: durationMinutes > 0 ? durationMinutes : 60
    });

    if (!meetingResult.success) {
      return res.status(500).json({
        success: false,
        message: "Failed to create meeting link"
      });
    }

    const session = await LiveSession.create({
      teacherId,
      classId,
      timetableEntryId: timetableEntryId || null,
      subjectName,
      className,
      grade: grade || "",
      meetingLink: meetingResult.joinUrl,
      meetingId: meetingResult.meetingId,
      meetingPassword: meetingResult.password,
      startUrl: meetingResult.startUrl,
      isZoomMeeting: meetingResult.isZoomMeeting,
      status: "active",
      scheduledDate: new Date(),
      startTime,
      endTime,
      startedAt: new Date()
    });

    res.status(201).json({
      success: true,
      message: "Live session started successfully",
      data: {
        _id: session._id,
        subjectName: session.subjectName,
        className: session.className,
        grade: session.grade,
        meetingLink: session.meetingLink,
        startUrl: meetingResult.startUrl,
        meetingPassword: meetingResult.password,
        startTime: session.startTime,
        endTime: session.endTime,
        status: session.status,
        startedAt: session.startedAt
      }
    });
  } catch (err) {
    console.error("Error creating live session:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// GET /api/live-session/sessions
// Returns all sessions for the teacher (with optional status filter ?status=active)
exports.getSessions = async (req, res) => {
  try {
    const teacherId = req.user.id;
    const { status } = req.query;

    const query = { teacherId };
    if (status) query.status = status;

    const sessions = await LiveSession.find(query)
      .sort({ createdAt: -1 })
      .limit(20);

    res.status(200).json({ success: true, data: sessions });
  } catch (err) {
    console.error("Error fetching sessions:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// GET /api/live-session/active
// Returns active sessions for the teacher — used by Join Class page
exports.getActiveSessions = async (req, res) => {
  try {
    const teacherId = req.user.id;

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const sessions = await LiveSession.find({
      teacherId,
      status: "active",
      scheduledDate: { $gte: todayStart }
    }).sort({ startedAt: -1 });

    res.status(200).json({ success: true, data: sessions });
  } catch (err) {
    console.error("Error fetching active sessions:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// GET /api/live-session/:id/join
// Returns the session detail including meeting link (teacher or student)
exports.joinSession = async (req, res) => {
  try {
    const session = await LiveSession.findById(req.params.id);
    if (!session) {
      return res.status(404).json({ success: false, message: "Session not found" });
    }
    if (session.status === "ended") {
      return res.status(400).json({ success: false, message: "This session has ended" });
    }

    res.status(200).json({
      success: true,
      data: {
        _id: session._id,
        meetingLink: session.meetingLink,
        startUrl: session.startUrl, // For teacher to start as host
        meetingPassword: session.meetingPassword,
        meetingId: session.meetingId,
        isZoomMeeting: session.isZoomMeeting,
        subjectName: session.subjectName,
        className: session.className,
        grade: session.grade,
        status: session.status,
        startedAt: session.startedAt,
        startTime: session.startTime,
        endTime: session.endTime,
        teacherId: session.teacherId
      }
    });
  } catch (err) {
    console.error("Error joining session:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// PATCH /api/live-session/:id/end
// Marks a live session as ended
exports.endSession = async (req, res) => {
  try {
    const teacherId = req.user.id;
    const session = await LiveSession.findOne({ _id: req.params.id, teacherId });

    if (!session) {
      return res.status(404).json({ success: false, message: "Session not found" });
    }

    session.status = "ended";
    session.endedAt = new Date();
    await session.save();

    res.status(200).json({
      success: true,
      message: "Session ended successfully",
      data: session
    });
  } catch (err) {
    console.error("Error ending session:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// POST /api/live-session/:id/attendance
// Body: { attendees: [{ studentId, studentName, present }] }
exports.markAttendance = async (req, res) => {
  try {
    const teacherId = req.user.id;
    const { attendees } = req.body;

    const session = await LiveSession.findOne({ _id: req.params.id, teacherId });
    if (!session) {
      return res.status(404).json({ success: false, message: "Session not found" });
    }

    // Merge or replace attendees
    session.attendees = (attendees || []).map((a) => ({
      studentId: a.studentId,
      studentName: a.studentName,
      joinedAt: new Date(),
      present: a.present !== false
    }));

    await session.save();

    res.status(200).json({
      success: true,
      message: "Attendance marked successfully",
      data: session
    });
  } catch (err) {
    console.error("Error marking attendance:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// GET /api/live-session/:id/students
// Returns students in the session's class for attendance marking
exports.getSessionStudents = async (req, res) => {
  try {
    const teacherId = req.user.id;
    const session = await LiveSession.findOne({ _id: req.params.id, teacherId });
    if (!session) {
      return res.status(404).json({ success: false, message: "Session not found" });
    }

    const classInfo = await ClassSubject.findById(session.classId).select("grade");
    if (!classInfo) {
      return res.status(404).json({ success: false, message: "Class not found" });
    }

    const students = await User.find({
      role: "student",
      class: classInfo.grade
    }).select("fullName userId email");

    res.status(200).json({ success: true, data: students });
  } catch (err) {
    console.error("Error fetching session students:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
