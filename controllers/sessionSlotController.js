const moment = require("moment-timezone");
const TeacherAvailability = require("../models/TeacherAvailability");
const SessionSlot = require("../models/sessionSlot");
const User = require("../models/user");
const generateAvailableSlots = require("../utils/generateAvailableSlots");

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


    const availableSlots = generateAvailableSlots({
      date: parsedDate,
      availability: dayAvailability,
      sessionDuration,
      breakDuration,
      bookedSlots: [], 
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
    const student = await User.findById(req.user.id);
    const timezone = student.timezone || "Asia/Kolkata";
    const teacher = await User.findById(student.teacherId);

    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const sessions = await SessionSlot.find({
      teacherId: student.teacherId,
      $or: [
        { allowedStudentId: null },
        { allowedStudentId: student._id }
      ]
    })
      .skip(skip)
      .limit(limit);
      
    const availability = await TeacherAvailability.findOne({
      teacherId: student.teacherId
    });

    const response = [];

    for (const session of sessions) {
      const day = moment(session.date).format("dddd").toLowerCase();
      const dayAvailability = availability.weeklyAvailability.find(
        d => d.day === day
      );

      if (!dayAvailability) continue;

      let slots = generateAvailableSlots({
        date: session.date,
        availability: dayAvailability,
        sessionDuration: session.sessionDuration,
        breakDuration: session.breakDuration,
        bookedSlots: session.bookedSlots,
        teacherTimezone: teacher.timezone || "Asia/Kolkata",
        studentTimezone: student.timezone || "Asia/Kolkata"
      });

      slots = slots.filter(slot => {
        return !session.bookedSlots.some(b => {
          const bookedStart = moment(b.startTime).tz(timezone).format("HH:mm");
          return bookedStart === slot.startTime;
        });
      });

      response.push({
        sessionId: session._id,
        title: session.title,
        date: moment(session.date).tz(timezone).format("DD-MM-YYYY/dddd"),
        slots
      });
    }

    res.json({
      pagination: {
        page,
        limit,
        count: response.length
      },
      sessions: response
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
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

    const slotStartUTC = moment.tz(
      `${moment(session.date).format("DD-MM-YYYY")} ${startTime}`,
      "DD-MM-YYYY HH:mm",
      student.timezone || "Asia/Kolkata"
    ).utc();

    const slotEndUTC = slotStartUTC.clone().add(session.sessionDuration, "minutes");

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
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const sessions = await SessionSlot.find({
      "bookedSlots.bookedBy": studentId
    })
      
    const bookedSlots = [];

    for (const session of sessions) {
      for (const slot of session.bookedSlots) {
        if (String(slot.bookedBy) === String(studentId)) {
          bookedSlots.push({
            sessionId: session._id,
            title: session.title,
            teacherName: session.teacherId.name,
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
    res.status(500).json({ message: error.message });
  }
};

exports.getTeacherSessions = async (req, res) => {
  try {
    const teacherId = req.user.id;
    const name = req.user.name;

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
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
    
    res.json({
      pagination: {
        teacherName: name,
        teacherId: teacherId,
        totalSessions,
        currentPage: page,
        totalPages: Math.ceil(totalSessions / limit),
        limit
      },
      sessions
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
