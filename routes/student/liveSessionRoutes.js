const express = require("express");
const router = express.Router();
const jwtAuth = require("../../middleware/auth");
const LiveSession = require("../../models/LiveSession");
const ClassSubject = require("../../models/ClassSubject");
const User = require("../../models/user");

// All routes require student authentication
router.use(jwtAuth);

// GET /api/student/live-sessions
// Returns active live sessions for the student's class
router.get("/live-sessions", async (req, res) => {
  try {
    const studentId = req.user.id;
    
    // Get student's grade/class info
    const student = await User.findById(studentId).select("class grade");
    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // Find all active sessions for student's grade
    const sessions = await LiveSession.find({
      grade: student.class || student.grade,
      status: "active",
      scheduledDate: { $gte: todayStart, $lte: todayEnd }
    })
      .populate("teacherId", "fullName")
      .sort({ startTime: 1 });

    // Format sessions for student view
    const formattedSessions = sessions.map(session => ({
      _id: session._id,
      subjectName: session.subjectName,
      className: session.className,
      grade: session.grade,
      teacherName: session.teacherId ? session.teacherId.fullName : "Unknown Teacher",
      meetingLink: session.meetingLink,
      meetingPassword: session.meetingPassword,
      startTime: session.startTime,
      endTime: session.endTime,
      startedAt: session.startedAt,
      status: session.status,
      isZoomMeeting: session.isZoomMeeting
    }));

    res.status(200).json({
      success: true,
      data: formattedSessions,
      studentClass: student.class || student.grade
    });
  } catch (err) {
    console.error("Error fetching student live sessions:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// GET /api/student/live-sessions/:id/join
// Returns session details for student to join
router.get("/live-sessions/:id/join", async (req, res) => {
  try {
    const studentId = req.user.id;
    const sessionId = req.params.id;

    // Get student's class info
    const student = await User.findById(studentId).select("class grade fullName");
    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    // Find the session
    const session = await LiveSession.findById(sessionId);
    if (!session) {
      return res.status(404).json({ success: false, message: "Session not found" });
    }

    // Verify student is in the same grade/class
    if (session.grade !== (student.class || student.grade)) {
      return res.status(403).json({ success: false, message: "You are not authorized to join this session" });
    }

    if (session.status === "ended") {
      return res.status(400).json({ success: false, message: "This session has ended" });
    }

    // Check if student already joined
    const alreadyJoined = session.attendees.some(
      attendee => attendee.studentId.toString() === studentId
    );

    // Add student to attendees if not already there
    if (!alreadyJoined && session.status === "active") {
      session.attendees.push({
        studentId: studentId,
        studentName: student.fullName,
        joinedAt: new Date(),
        present: true
      });
      await session.save();
    }

    res.status(200).json({
      success: true,
      data: {
        _id: session._id,
        meetingLink: session.meetingLink,
        meetingPassword: session.meetingPassword,
        meetingId: session.meetingId,
        subjectName: session.subjectName,
        className: session.className,
        teacherName: session.teacherId ? session.teacherId.fullName : "Unknown Teacher",
        status: session.status,
        startedAt: session.startedAt,
        startTime: session.startTime,
        endTime: session.endTime,
        isZoomMeeting: session.isZoomMeeting,
        joined: !alreadyJoined || true
      }
    });
  } catch (err) {
    console.error("Error joining session:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// POST /api/student/live-sessions/:id/leave
// Records when student leaves the session
router.post("/live-sessions/:id/leave", async (req, res) => {
  try {
    const studentId = req.user.id;
    const sessionId = req.params.id;

    const session = await LiveSession.findById(sessionId);
    if (!session) {
      return res.status(404).json({ success: false, message: "Session not found" });
    }

    // Update attendee record (mark as attended but left)
    const attendee = session.attendees.find(
      a => a.studentId.toString() === studentId
    );
    
    if (attendee) {
      attendee.present = true; // They were present at some point
    }

    await session.save();

    res.status(200).json({
      success: true,
      message: "Session leave recorded"
    });
  } catch (err) {
    console.error("Error recording session leave:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;
