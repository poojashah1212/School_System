const moment = require("moment-timezone");
const TeacherAvailability = require("../models/TeacherAvailability");
const SessionSlot = require("../models/sessionSlot");
const User = require("../models/user");
const generateAvailableSlots = require("../utils/generateAvailableSlots");
const { redisClient } = require("../config/redis");

exports.createSessionSlots = async (req, res) => {
  try {
    const {
      title,
      date,
      sessionDuration,
      breakDuration,
      student_id,
      studentTimezone
    } = req.body;

    const teacherId = req.user.id;
    const teacherTimezone = req.user.timezone || "Asia/Kolkata";

    const parsedDate = moment(date, "DD-MM-YYYY").startOf("day").toDate();

    const availability = await TeacherAvailability.findOne({ teacherId });
    if (!availability) {
      return res.status(400).json({ message: "Teacher availability not set" });
    }

    const isHoliday = availability.holidays.some(
      h => parsedDate >= h.startDate && parsedDate <= h.endDate
    );
    if (isHoliday) {
      return res.status(400).json({ message: "Session date is a holiday" });
    }

    const day = moment(parsedDate).format("dddd").toLowerCase();
    const dayAvailability = availability.weeklyAvailability.find(
      d => d.day === day
    );

    if (!dayAvailability) {
      return res
        .status(400)
        .json({ message: "Teacher is not available on this day" });
    }

    let allowedStudentId = null;
    if (student_id) {
      const student = await User.findOne({ _id: student_id, teacherId });
      if (!student) {
        return res
          .status(403)
          .json({ message: "Invalid student for this teacher" });
      }
      allowedStudentId = student._id;
    }

    const existingSession = await SessionSlot.findOne({
      teacherId,
      date: parsedDate
    });

    if (existingSession) {
      return res.status(400).json({
        message: "Session slots are already created for this date"
      });
    }

    const session = await SessionSlot.create({
      teacherId,
      title,
      date: parsedDate,
      sessionDuration,
      breakDuration,
      allowedStudentId
    });

    const availableSlots = await generateAvailableSlots({
      date: parsedDate,
      availability: dayAvailability,
      sessionDuration,
      breakDuration,
      bookedSlots: [], 
      sessionId: session._id,
      teacherId,
      teacherTimezone,
      studentTimezone: studentTimezone || teacherTimezone
    });

    return res.status(201).json({
      message: "Session slots created successfully",
      sessionId: session._id,
      title: session.title,
      date: moment(session.date).format("DD-MM-YYYY"),
      availableSlots 
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getMySessionSlots = async (req, res) => {
  try {
    // Get student with populated teacher info
    const student = await User.findById(req.user.id).populate('teacherId', 'fullName email timezone');
    
    if (!student) {
      return res.status(404).json({ 
        success: false,
        message: "Student not found" 
      });
    }
    
    // Check if student has a teacher assigned
    if (!student.teacherId) {
      return res.status(404).json({ 
        success: false,
        message: "No teacher assigned to this student" 
      });
    }
    
    const teacher = student.teacherId;
    const studentTimezone = student.timezone || "Asia/Kolkata";
    const teacherTimezone = teacher.timezone || "Asia/Kolkata";

    console.log('Student timezone from DB:', student.timezone);
    console.log('Final student timezone used:', studentTimezone);
    console.log('Teacher timezone:', teacherTimezone);

    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Get teacher's availability to know which days they work
    const availability = await TeacherAvailability.findOne({ teacherId: teacher._id });
    
    if (!availability) {
      return res.status(404).json({ 
        success: false,
        message: "Teacher availability not found" 
      });
    }

    // Build query for sessions accessible to this student
    const sessionQuery = {
      teacherId: teacher._id,
      $or: [
        { allowedStudentId: null }, // Available to all students
        { allowedStudentId: student._id } // Specifically for this student
      ]
    };

    // Get total count for pagination
    const totalSessions = await SessionSlot.countDocuments(sessionQuery);

    // Get session slots for this teacher that are accessible to the student
    const sessions = await SessionSlot.find(sessionQuery)
      .populate('allowedStudentId', 'fullName email')
      .sort({ date: 1 })
      .skip(skip)
      .limit(limit);

    // Process sessions to available slots
    const response = [];
    
    for (const session of sessions) {
      // Get day availability for this session
      const dayName = moment(session.date).format("dddd").toLowerCase();
      const dayAvailability = availability.weeklyAvailability.find(
        d => d.day === dayName
      );

      if (!dayAvailability) {
        console.log("No availability found for day:", dayName);
        continue;
      }

      // Generate available slots for this session
      const availableSlots = await generateAvailableSlots({
        date: session.date,
        availability: dayAvailability,
        sessionDuration: session.sessionDuration,
        breakDuration: session.breakDuration,
        bookedSlots: session.bookedSlots || [],
        teacherId: teacher._id,
        sessionId: session._id,
        studentId: student._id,
        teacherTimezone,
        studentTimezone
      });

      // Filter out already booked slots
      const availableSlotsFiltered = availableSlots.filter(slot => {
        return !session.bookedSlots.some(bookedSlot => {
          const bookedStart = moment(bookedSlot.startTime).tz(studentTimezone).format("HH:mm");
          return bookedStart === slot.startTime;
        });
      });

      response.push({
        sessionId: session._id,
        title: session.title,
        date: moment(session.date).tz(teacherTimezone).format("DD-MM-YYYY/dddd"),
        day: dayName,
        sessionDuration: session.sessionDuration,
        availableSlots: availableSlotsFiltered,
        allowedStudents: session.allowedStudentId ? [session.allowedStudentId] : null,
        type: session.allowedStudentId ? "personal" : "common", // Add session type
        isAccessible: true
      });
      
      console.log('=== SESSION RESPONSE DEBUG ===');
      console.log('Session title:', session.title);
      console.log('Student timezone used:', studentTimezone);
      console.log('Available slots count:', availableSlotsFiltered.length);
      console.log('First 3 slots:', availableSlotsFiltered.slice(0, 3));
      console.log('=============================');
    }

    res.json({
      success: true,
      pagination: {
        page,
        limit,
        total: totalSessions,
        pages: Math.ceil(totalSessions / limit)
      },
      teacher: {
        id: teacher._id,
        fullName: teacher.fullName,
        email: teacher.email,
        timezone: teacher.timezone
      },
      sessions: response
    });
    
  } catch (err) {
    console.error("Get session slots error:", err);
    res.status(500).json({ 
      success: false,
      message: "Failed to fetch session slots: " + err.message 
    });
  }
};

exports.confirmSessionSlot = async (req, res) => {
   try {
    const { sessionId, startTime } = req.body;
    const studentId = req.user.id;

    const student = await User.findById(studentId);
    if (!student) return res.status(404).json({ message: "Student not found" });

    const session = await SessionSlot.findById(sessionId);
    if (!session) return res.status(404).json({ message: "Session not found" });

    if (String(session.teacherId) !== String(student.teacherId))
      return res.status(403).json({ message: "You are not allowed to book a session!!" });

    if (session.allowedStudentId && String(session.allowedStudentId) !== String(studentId))
      return res.status(403).json({ message: "Not allowed" });

    // Check if session date is a holiday
    const teacherAvailability = await TeacherAvailability.findOne({ teacherId: session.teacherId });
    if (teacherAvailability) {
      const sessionDate = moment(session.date, "DD-MM-YYYY").startOf("day").toDate();
      const isHoliday = teacherAvailability.holidays.some(
        h => sessionDate >= h.startDate && sessionDate <= h.endDate
      );
      if (isHoliday) {
        return res.status(400).json({ message: "Session date is a holiday. Please select a different date." });
      }
    }

    const slotStartUTC = moment.tz(
      `${moment(session.date).format("DD-MM-YYYY")} ${startTime}`,
      "DD-MM-YYYY HH:mm",
      student.timezone || "Asia/Kolkata"
    ).utc();

    const slotEndUTC = slotStartUTC.clone().add(session.sessionDuration, "minutes");
    const isValidSlot = session.availableSlots?.some(slot =>
      moment(slot.startTime).utc().isSame(slotStartUTC)
    );

    if (!isValidSlot) {
      return res.status(400).json({
        message: "Invalid slot. Please select from available slots only"
      });
    }

    if (session.bookedSlots.some(s => s.startTime.getTime() === slotStartUTC.toDate().getTime()))
      return res.status(400).json({ message: "This slot is already booked" });

    session.bookedSlots.push({ startTime: slotStartUTC.toDate(), endTime: slotEndUTC.toDate(), bookedBy: studentId });
    await session.save();

    res.json({
      message: "Slot booked successfully",
      booking: {
        sessionId: session._id,
        date: moment(slotStartUTC).tz(student.timezone).format("DD-MM-YYYY"),
        startTime: moment(slotStartUTC).tz(student.timezone).format("HH:mm"),
        endTime: moment(slotEndUTC).tz(student.timezone).format("HH:mm")
      }
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getMyConfirmedSessions = async (req, res) => {
  try {
    const studentId = req.user.id;

    const student = await User.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    const timezone = student.timezone || "Asia/Kolkata";

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 3;
    const skip = (page - 1) * limit;

    // Get sessions where the student has booked slots
    const sessions = await SessionSlot.find({
      "bookedSlots.bookedBy": studentId
    })
    .populate('bookedSlots.bookedBy', 'fullName email')
    .populate('teacherId', 'fullName email')
    .sort({ 'bookedSlots.startTime': 1 });

    const bookedSlots = [];

    for (const session of sessions) {
      for (const slot of session.bookedSlots) {
        if (String(slot.bookedBy) === String(studentId)) {
          bookedSlots.push({
            sessionId: session._id,
            title: session.title,
            teacherName: session.teacherId ? session.teacherId.fullName : 'Unknown',
            teacherEmail: session.teacherId ? session.teacherId.email : '',
            startTime: slot.startTime,
            endTime: slot.endTime
          });
        }
      }
    }

    const totalSessions = bookedSlots.length;
    const paginatedSlots = bookedSlots.slice(skip, skip + limit);

    const formattedSessions = paginatedSlots.map(s => ({
      sessionId: s.sessionId,
      title: s.title,
      teacherName: s.teacherName,
      teacherEmail: s.teacherEmail,
      date: moment(s.startTime).tz(timezone).format("DD-MM-YYYY"),
      startTime: moment(s.startTime).tz(timezone).format("HH:mm"),
      endTime: moment(s.endTime).tz(timezone).format("HH:mm")
    }));

    res.json({
      pagination: {
        totalSessions,
        currentPage: page,
        totalPages: Math.ceil(totalSessions / limit),
        limit
      },
      sessions: formattedSessions
    });

  } catch (error) {
    console.error("Get confirmed sessions error:", error);
    res.status(500).json({ message: error.message });
  }
};

exports.getTeacherSessions = async (req, res) => {
  try {
    const teacherId = req.user.id;
    const name = req.user.name;
    const teacherTimezone = req.user.timezone || "Asia/Kolkata";

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const skip = (page - 1) * limit;

    const type = req.query.type;

    const query = { teacherId };

    if (type === "personal") {
      query.allowedStudentId = { $ne: null };
    }

    if (type === "common") {
      query.allowedStudentId = null;
    }

    const totalSessions = await SessionSlot.countDocuments(query);

    const sessions = await SessionSlot.find(query)
      .sort({ startTime: 1 })
      .skip(skip)
      .limit(limit)
      .populate('bookedSlots.bookedBy', 'fullName email')
      .populate('allowedStudentId', 'fullName email')
      .lean();
    
    const formattedSessions = sessions.map(session => {
      // Format date in teacher's timezone
      const formattedDate = moment(session.date).tz(teacherTimezone).format("DD-MM-YYYY");
      
      return {
        ...session,
        type: session.allowedStudentId ? "personal" : "common",
        studentName: session.allowedStudentId ? session.allowedStudentId.fullName : null,
        studentEmail: session.allowedStudentId ? session.allowedStudentId.email : null,
        date: formattedDate // Use teacher's timezone for date display
      };
    });
    
    res.json({
      pagination: {
        teacherName: name,
        teacherId: teacherId,
        totalSessions,
        currentPage: page,
        totalPages: Math.ceil(totalSessions / limit),
        limit
      },
      sessions: formattedSessions
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteSession = async (req, res) => {
  try {
    const { id } = req.params;
    const teacherId = req.user.id;

    const session = await SessionSlot.findOne({ _id: id, teacherId });
    
    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    // Check if session has any booked slots
    if (session.bookedSlots && session.bookedSlots.length > 0) {
      return res.status(400).json({ 
        message: "Cannot delete session with existing bookings" 
      });
    }

    // Delete the session
    await SessionSlot.deleteOne({ _id: id, teacherId });

    res.json({
      message: "Session deleted successfully",
      sessionId: id
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getSessionById = async (req, res) => {
  try {
    const { id } = req.params;
    const teacherId = req.user.id;

    const session = await SessionSlot.findOne({ _id: id, teacherId })
      .populate('bookedSlots.bookedBy', 'fullName email')
      .populate('allowedStudentId', 'fullName email')
      .lean();

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    // Get teacher availability and timezone to generate available slots
    const teacher = await User.findById(teacherId);
    const availability = await TeacherAvailability.findOne({ teacherId });
    const teacherTimezone = teacher.timezone || "Asia/Kolkata"; // Define teacherTimezone in broader scope
    
    if (availability && teacher) {
      const day = moment(session.date).format("dddd").toLowerCase();
      const dayAvailability = availability.weeklyAvailability.find(
        d => d.day === day
      );

      if (dayAvailability) {
        // Generate available slots for this session using teacher's timezone
        const availableSlots = await generateAvailableSlots({
          date: session.date,
          availability: dayAvailability,
          sessionDuration: session.sessionDuration,
          breakDuration: session.breakDuration,
          bookedSlots: session.bookedSlots || [],
          sessionId: session._id,
          teacherId,
          teacherTimezone,
          studentTimezone: teacherTimezone // Use teacher's timezone for consistency in teacher dashboard
        });

        // Filter out already booked slots by comparing start times
        const filteredSlots = availableSlots.filter(slot => {
          return !session.bookedSlots?.some(bookedSlot => {
            const bookedStartTime = moment(bookedSlot.startTime).tz(teacherTimezone).format("HH:mm");
            return bookedStartTime === slot.startTime;
          });
        });

        session.availableSlots = filteredSlots;
      }
    }
    

    // Add session type and student info to the response
    const formattedSession = {
      ...session,
      type: session.allowedStudentId ? "personal" : "common",
      studentName: session.allowedStudentId ? session.allowedStudentId.fullName : null,
      studentEmail: session.allowedStudentId ? session.allowedStudentId.email : null,
      date: session.date ? moment(session.date).tz(teacherTimezone).format("DD-MM-YYYY") : session.date
    };

    res.json(formattedSession);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
