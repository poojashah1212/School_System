const moment = require("moment-timezone");
const { redisClient } = require("../config/redis");

const generateAvailableSlots = async ({
  date,
  availability,
  sessionDuration,
  breakDuration,
  bookedSlots = [],
  teacherId,
  sessionId,
  studentId,
  teacherTimezone,
  studentTimezone
}) => {
  

  const bookedSlotsSignature = `${bookedSlots.length}:${bookedSlots.reduce((max, b) => {
    const t = new Date((b && (b.bookedAt || b.startTime)) || 0).getTime();
    return Math.max(max, t);
  }, 0)}`;

  const studentRedisKey = `slots:student:${studentId}:${sessionId}:${moment(date).format("YYYY-MM-DD")}:${availability.startTime}-${availability.endTime}:${studentTimezone}:${bookedSlotsSignature}`;

  const teacherRedisKey = `slots:teacher:${teacherId}:${sessionId}:${moment(date).format("YYYY-MM-DD")}:${availability.startTime}-${availability.endTime}:${teacherTimezone}:${bookedSlotsSignature}`;

  const studentCached = await redisClient.get(studentRedisKey);
  if (studentCached) {
    console.log("Student Cache HIT:", studentRedisKey);
    return JSON.parse(studentCached);
  }

  // Don't check teacher cache for student requests to avoid timezone conflicts
  // Only check teacher cache when studentId is not provided (teacher requests)
  if (!studentId) {
    const teacherCached = await redisClient.get(teacherRedisKey);
    if (teacherCached) {
      console.log("Teacher Cache HIT:", teacherRedisKey);
      return JSON.parse(teacherCached);
    }
  }

  const slots = [];

  // Create start and end times in teacher's timezone
  const teacherStartDateTime = moment.tz(
    `${moment(date).format("YYYY-MM-DD")} ${availability.startTime}`,
    "YYYY-MM-DD HH:mm",
    teacherTimezone
  );

  const teacherEndDateTime = moment.tz(
    `${moment(date).format("YYYY-MM-DD")} ${availability.endTime}`,
    "YYYY-MM-DD HH:mm",
    teacherTimezone
  );

  console.log('Teacher start time in teacher TZ:', teacherStartDateTime.format());
  console.log('Teacher end time in teacher TZ:', teacherEndDateTime.format());
  console.log('Teacher availability from DB - startTime:', availability.startTime, 'endTime:', availability.endTime);

  let current = teacherStartDateTime;
  const end = teacherEndDateTime;

  while (
    current.clone().add(sessionDuration, "minutes").isSameOrBefore(end)
  ) {
    const slotStartTeacherTZ = current.clone();
    const slotEndTeacherTZ = slotStartTeacherTZ
      .clone()
      .add(sessionDuration, "minutes");

    console.log('Slot generation - Teacher time:', slotStartTeacherTZ.format(), '-', slotEndTeacherTZ.format());

    // Check for overlaps using teacher timezone times
    const isOverlapping = bookedSlots.some(b => {
      const bookedStartTeacherTZ = moment.tz(b.startTime, teacherTimezone);
      const bookedEndTeacherTZ = moment.tz(b.endTime, teacherTimezone);
      return (
        slotStartTeacherTZ.isBefore(bookedEndTeacherTZ) && slotEndTeacherTZ.isAfter(bookedStartTeacherTZ)
      );
    });

    if (!isOverlapping) {
      // Generate and display slots strictly in teacher's timezone
      // No UTC conversions for teacher requests - use teacher availability directly
      let displayStartTime, displayEndTime;
      
      if (studentId) {
        // Student request - convert to student timezone
        console.log('  STUDENT REQUEST - Converting to student timezone:', studentTimezone);
        console.log('  Teacher time before conversion:', slotStartTeacherTZ.format(), '-', slotEndTeacherTZ.format());
        
        const slotStartStudentTZ = slotStartTeacherTZ.tz(studentTimezone);
        const slotEndStudentTZ = slotEndTeacherTZ.tz(studentTimezone);
        
        displayStartTime = slotStartStudentTZ.format("HH:mm");
        displayEndTime = slotEndStudentTZ.format("HH:mm");
        
        console.log('  Student display time:', displayStartTime, '-', displayEndTime);
        console.log('  Converted student times:', slotStartStudentTZ.format(), '-', slotEndStudentTZ.format());
      } else {
        // Teacher request - display exactly as per teacher availability, no UTC conversion
        displayStartTime = slotStartTeacherTZ.format("HH:mm");
        displayEndTime = slotEndTeacherTZ.format("HH:mm");
        
        console.log('  Teacher display time (direct from availability):', displayStartTime, '-', displayEndTime);
      }

      slots.push({
        startTime: displayStartTime,
        endTime: displayEndTime,
        // Store teacher timezone times directly for consistency
        teacherStart: slotStartTeacherTZ.toDate(),
        teacherEnd: slotEndTeacherTZ.toDate()
      });
    }

    current = slotEndTeacherTZ.clone().add(breakDuration, "minutes");
  }
  
  await redisClient.setEx(
    studentRedisKey,
    60 * 60 * 24,
    JSON.stringify(slots)
  );

  // Only save to teacher cache when it's a teacher request
  if (!studentId) {
    await redisClient.setEx(
      teacherRedisKey,
      60 * 60 * 24,
      JSON.stringify(slots)
    );
  }

  return slots;
};

module.exports = generateAvailableSlots;

