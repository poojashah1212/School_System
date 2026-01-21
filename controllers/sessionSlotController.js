const moment = require("moment-timezone");
const TeacherAvailability = require("../models/TeacherAvailability");
const SessionSlot = require("../models/sessionSlot");
const User = require("../models/user");
const generateAvailableSlots = require("../utils/generateAvailableSlots");
const { redisClient } = require("../config/redis");

const normalizeTimezone = (tz) => {
  if (!tz || typeof tz !== 'string') return "Asia/Kolkata";
  const cleaned = tz.replace(/\s*\([^)]*\)\s*/g, '').trim();
  if (!cleaned) return "Asia/Kolkata";
  return moment.tz.zone(cleaned) ? cleaned : "Asia/Kolkata";
};

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
    
    // Default to 120 minutes (2 hours) if not specified, for better slot display
    const finalSessionDuration = sessionDuration || 120;
    const finalBreakDuration = breakDuration || 10;

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
      sessionDuration: finalSessionDuration,
      breakDuration: finalBreakDuration,
      allowedStudentId
    });

    console.log('createSessionSlots - teacherTimezone:', teacherTimezone);
    console.log('createSessionSlots - studentTimezone (using teacher):', teacherTimezone);
    
    const availableSlots = await generateAvailableSlots({
      date: parsedDate,
      availability: dayAvailability,
      sessionDuration: finalSessionDuration,
      breakDuration: finalBreakDuration,
      bookedSlots: [],
      sessionId: session._id,
      teacherId,
      teacherTimezone,
      studentTimezone: teacherTimezone // For teacher session creation, use teacher timezone
    });
    
    console.log('createSessionSlots - generated slots:', availableSlots.slice(0, 3));

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
    const studentTimezone = normalizeTimezone(student.timezone);
    const teacherTimezone = teacher.timezone || "Asia/Kolkata";
    
    console.log('getMySessionSlots - studentTimezone:', studentTimezone);
    console.log('getMySessionSlots - teacherTimezone:', teacherTimezone);
    console.log('getMySessionSlots - student.timezone:', student.timezone);

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
          // Convert booked slot time to student timezone for comparison
          const bookedStartInStudentTZ = moment.utc(bookedSlot.startTime).tz(studentTimezone).format("HH:mm");
          return bookedStartInStudentTZ === slot.startTime;
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
    const { sessionId, startTime, date } = req.body;
    const studentId = req.user.id;

    const student = await User.findById(studentId);
    if (!student) return res.status(404).json({ message: "Student not found" });

    const session = await SessionSlot.findById(sessionId);
    if (!session) return res.status(404).json({ message: "Session not found" });

    const teacher = await User.findById(session.teacherId).select("timezone");
    const teacherTimezone = normalizeTimezone(teacher?.timezone);

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

    // Generate available slots dynamically for validation
    const availability = await TeacherAvailability.findOne({ teacherId: session.teacherId });
    if (!availability) {
      return res.status(400).json({ message: "Teacher availability not found" });
    }

    const dayName = moment(session.date).format("dddd").toLowerCase();
    const dayAvailability = availability.weeklyAvailability.find(
      d => d.day === dayName
    );

    if (!dayAvailability) {
      return res.status(400).json({ message: "No availability found for this day" });
    }

    // Use the same generateAvailableSlots function for consistency
    const availableSlots = await generateAvailableSlots({
      date: session.date,
      availability: dayAvailability,
      sessionDuration: session.sessionDuration,
      breakDuration: session.breakDuration,
      bookedSlots: session.bookedSlots || [],
      teacherId: session.teacherId,
      sessionId: session._id,
      studentId: studentId,
      teacherTimezone,
      studentTimezone: normalizeTimezone(student.timezone)
    });

    console.log('Backend debug - received date:', date);
    console.log('Backend debug - received startTime:', startTime);
    console.log('Backend debug - teacherTimezone:', teacherTimezone);
    console.log('Backend debug - studentTimezone:', normalizeTimezone(student.timezone));
    console.log('Backend debug - session.date (raw):', session.date);
    console.log('Backend debug - session.date (formatted):', moment(session.date).format("DD-MM-YYYY"));
    
    // Find matching slot by startTime (the frontend sends times in student timezone)
    const matchingSlot = availableSlots?.find(slot => {
      return slot.startTime === startTime;
    });

    console.log('Backend debug - matchingSlot:', matchingSlot);
    console.log('Backend debug - matchingSlot.startTime:', matchingSlot.startTime);
    console.log('Backend debug - matchingSlot.endTime:', matchingSlot.endTime);

    if (!matchingSlot) {
      return res.status(400).json({
        message: "Invalid slot. Please select from available slots only"
      });
    }

    // Use teacher timezone timestamps from available slot
    // These are stored as teacherStart and teacherEnd in the slot object
    const bookingStartUTC = moment.utc(matchingSlot.teacherStart);
    const bookingEndUTC = moment.utc(matchingSlot.teacherEnd);

    // Check if this slot is already booked (double-click / double API call protection)
    const alreadyBooked = session.bookedSlots.some(b => {
      return (
        b.startTime.getTime() === bookingStartUTC.toDate().getTime() &&
        b.bookedBy.toString() === studentId.toString()
      );
    });

    if (alreadyBooked) {
      return res.status(400).json({
        message: "This slot is already booked"
      });
    }

    // CRITICAL: Check if ANY student has already booked this time slot
    // This prevents double booking by different students
    const isSlotOccupied = session.bookedSlots.some(b => {
      const bookedStart = moment.utc(b.startTime);
      const bookedEnd = moment.utc(b.endTime);
      const requestedStart = bookingStartUTC;
      const requestedEnd = bookingEndUTC;
      
      // Check for any overlap
      return (
        (requestedStart.isSameOrAfter(bookedStart) && requestedStart.isBefore(bookedEnd)) ||
        (requestedEnd.isAfter(bookedStart) && requestedEnd.isSameOrBefore(bookedEnd)) ||
        (requestedStart.isSameOrBefore(bookedStart) && requestedEnd.isSameOrAfter(bookedEnd))
      );
    });

    if (isSlotOccupied) {
      return res.status(400).json({
        message: "This slot is already booked by another student"
      });
    }

    // Additional database-level check to prevent race conditions
    // Refresh session data to check for concurrent bookings
    const freshSession = await SessionSlot.findById(session._id);
    const concurrentBooking = freshSession.bookedSlots.some(b => {
      const bookedStart = moment.utc(b.startTime);
      const bookedEnd = moment.utc(b.endTime);
      const requestedStart = bookingStartUTC;
      const requestedEnd = bookingEndUTC;
      
      return (
        (requestedStart.isSameOrAfter(bookedStart) && requestedStart.isBefore(bookedEnd)) ||
        (requestedEnd.isAfter(bookedStart) && requestedEnd.isSameOrBefore(bookedEnd)) ||
        (requestedStart.isSameOrBefore(bookedStart) && requestedEnd.isSameOrAfter(bookedEnd))
      );
    });

    if (concurrentBooking) {
      return res.status(400).json({
        message: "This slot was just booked by another student. Please try a different time."
      });
    }

    // Atomically book the slot (prevents race-condition double booking)
    const bookingDoc = {
      startTime: bookingStartUTC.toDate(),
      endTime: bookingEndUTC.toDate(),
      bookedBy: studentId,
      bookedAt: new Date()
    };

    const updatedSession = await SessionSlot.findOneAndUpdate(
      {
        _id: session._id,
        $nor: [
          {
            bookedSlots: {
              $elemMatch: {
                startTime: { $lt: bookingDoc.endTime },
                endTime: { $gt: bookingDoc.startTime }
              }
            }
          }
        ]
      },
      { $push: { bookedSlots: bookingDoc } },
      { new: true }
    );

    if (!updatedSession) {
      return res.status(400).json({
        message: "This slot was just booked by another student. Please try a different time."
      });
    }

    // Return the exact same startTime and endTime that the student selected
    // No timezone conversion - these are already in student's timezone
    console.log('Backend debug - response startTime:', startTime);
    console.log('Backend debug - response endTime:', matchingSlot.endTime);
    
    // Fallback: if endTime is not available or invalid, calculate it based on session duration
    let endTime = matchingSlot.endTime;
    if (!endTime || endTime === startTime) {
        // Calculate endTime by adding session duration to startTime in student timezone
        const studentTimezone = normalizeTimezone(student.timezone);
        const startMoment = moment.tz(`${date} ${startTime}`, "DD-MM-YYYY HH:mm", studentTimezone);
        const endMoment = startMoment.clone().add(session.sessionDuration, "minutes");
        endTime = endMoment.format("HH:mm");
        console.log('Backend debug - calculated endTime:', endTime);
    }
    
    return res.json({
      message: "Slot booked successfully",
      booking: {
        sessionId: session._id,
        date: moment(session.date).format("DD-MM-YYYY"),
        startTime: startTime,  // Exact same time student selected
        endTime: endTime  // End time from available slot or calculated
      }
    });

  } catch (err) {
    // Handle MongoDB duplicate key error (code 11000)
    if (err.code === 11000) {
      return res.status(400).json({
        message: "This slot is already booked by another student"
      });
    }
    
    res.status(500).json({ message: err.message });
  }
};

exports.getMyConfirmedSessions = async (req, res) => {
  try {
    // Get logged-in student ID from auth token
    const studentId = req.user.id;

    // Get student details with timezone
    const student = await User.findById(studentId);
    if (!student) {
      return res.status(404).json({ 
        success: false,
        message: "Student not found" 
      });
    }

    const studentTimezone = student.timezone || "Asia/Kolkata";

    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 3;
    const skip = (page - 1) * limit;

    // Fetch sessions where this specific student has booked slots
    const sessions = await SessionSlot.find({
      "bookedSlots.bookedBy": studentId
    })
      .populate('bookedSlots.bookedBy', 'fullName email')
      .populate('teacherId', 'fullName email timezone')
      .sort({ 'bookedSlots.startTime': 1 });

    // Filter and process only this student's booked slots
    const confirmedBookings = [];
    
    for (const session of sessions) {
      // Get teacher timezone (from populated teacherId, or use default)
      const teacherTimezone = session.teacherId && session.teacherId.timezone 
        ? session.teacherId.timezone 
        : "Asia/Kolkata";
      
      for (const slot of session.bookedSlots) {
        // Only process slots booked by this student
        if (String(slot.bookedBy._id) === String(studentId)) {
          // Convert times from UTC to student's timezone
          // The booked slot times must be displayed in student's timezone
          const startTimeInStudentTZ = moment.utc(slot.startTime).tz(studentTimezone);
          const endTimeInStudentTZ = moment.utc(slot.endTime).tz(studentTimezone);
          
          confirmedBookings.push({
            sessionId: session._id,
            // Subject name from session title
            subject: session.title || 'Session',
            // Teacher name
            teacherName: session.teacherId ? session.teacherId.fullName : 'Unknown',
            // Session date in student's timezone
            date: startTimeInStudentTZ.format("DD-MM-YYYY"),
            // Start time & end time in student's timezone (HH:mm format only)
            startTime: startTimeInStudentTZ.format("HH:mm"),
            endTime: endTimeInStudentTZ.format("HH:mm"),
            // Additional info
            teacherEmail: session.teacherId ? session.teacherId.email : '',
            bookingDate: moment.utc(slot.bookedAt).tz(studentTimezone).format("DD-MM-YYYY HH:mm")
          });
        }
      }
    }

    const totalSessions = confirmedBookings.length;
    const paginatedBookings = confirmedBookings.slice(skip, skip + limit);

    // Return only confirmed bookings for this student
    res.json({
      success: true,
      pagination: {
        totalSessions,
        currentPage: page,
        totalPages: Math.ceil(totalSessions / limit),
        limit
      },
      sessions: paginatedBookings
    });

  } catch (error) {
    console.error("Error in getMyConfirmedSessions:", error);
    res.status(500).json({ 
      success: false,
      message: "Failed to fetch confirmed sessions: " + error.message 
    });
  }
};

exports.getTeacherSessions = async (req, res) => {
  try {
    const teacherId = req.user.id;
    const name = req.user.name;
    const teacherTimezone = req.user.timezone || "Asia/Kolkata";
    
    console.log('Teacher sessions - teacherTimezone:', teacherTimezone);
    console.log('Teacher sessions - req.user.timezone:', req.user.timezone);

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

      // Format booked slots in teacher's timezone with HH:MM format
      const formattedBookedSlots = session.bookedSlots ? session.bookedSlots.map(slot => ({
        ...slot,
        startTime: moment(slot.startTime).tz(teacherTimezone).format("HH:mm"),
        endTime: moment(slot.endTime).tz(teacherTimezone).format("HH:mm")
      })) : [];

      return {
        ...session,
        bookedSlots: formattedBookedSlots,
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


    // Format booked slots in teacher's timezone with HH:MM format
    const formattedBookedSlots = session.bookedSlots ? session.bookedSlots.map(slot => ({
      ...slot,
      startTime: moment(slot.startTime).tz(teacherTimezone).format("HH:mm"),
      endTime: moment(slot.endTime).tz(teacherTimezone).format("HH:mm")
    })) : [];

    // Add session type and student info to the response
    const formattedSession = {
      ...session,
      bookedSlots: formattedBookedSlots,
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

exports.getAllSlotsForSession = async (req, res) => {
  try {
    const { id } = req.params;
    const teacherId = req.user.id;

    const session = await SessionSlot.findOne({ _id: id, teacherId })
      .populate('bookedSlots.bookedBy', 'fullName email')
      .lean();

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    // Get teacher availability to generate all slots
    const teacher = await User.findById(teacherId);
    const availability = await TeacherAvailability.findOne({ teacherId });
    const teacherTimezone = teacher.timezone || "Asia/Kolkata";

    if (!availability) {
      return res.status(400).json({ message: "Teacher availability not found" });
    }

    // Get day availability
    const dayOfWeek = moment(session.date).format("dddd").toLowerCase();
    const dayAvailability = availability[dayOfWeek];

    if (!dayAvailability || !dayAvailability.startTime || !dayAvailability.endTime) {
      return res.status(400).json({ message: "No availability found for this day" });
    }

    // Generate all slots for this session using teacher's timezone
    const allSlots = await generateAvailableSlots({
      date: session.date,
      availability: dayAvailability,
      sessionDuration: session.sessionDuration,
      breakDuration: session.breakDuration,
      bookedSlots: session.bookedSlots || [],
      teacherId,
      sessionId: session._id,
      teacherTimezone,
      studentTimezone: teacherTimezone // Use teacher timezone for consistency
    });

    // Format booked slots in teacher's timezone with HH:MM format
    const formattedBookedSlots = session.bookedSlots ? session.bookedSlots.map(slot => ({
      ...slot,
      startTime: moment(slot.startTime).tz(teacherTimezone).format("HH:mm"),
      endTime: moment(slot.endTime).tz(teacherTimezone).format("HH:mm")
    })) : [];

    res.json({
      allSlots: allSlots,
      bookedSlots: formattedBookedSlots
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
