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
    return JSON.parse(studentCached);
  }

  // Don't check teacher cache for student requests to avoid timezone conflicts
  // Only check teacher cache when studentId is not provided (teacher requests)
  if (!studentId) {
    const teacherCached = await redisClient.get(teacherRedisKey);
    if (teacherCached) {
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

  let current = teacherStartDateTime;
  const end = teacherEndDateTime;

  while (
    current.clone().add(sessionDuration, "minutes").isSameOrBefore(end)
  ) {
    const slotStartTeacherTZ = current.clone();
    const slotEndTeacherTZ = slotStartTeacherTZ
      .clone()
      .add(sessionDuration, "minutes");

    // Check for overlaps using teacher timezone times
    const isOverlapping = bookedSlots.some(b => {
      const bookedStartTeacherTZ = moment.tz(b.startTime, teacherTimezone);
      const bookedEndTeacherTZ = moment.tz(b.endTime, teacherTimezone);
      return (
        slotStartTeacherTZ.isBefore(bookedEndTeacherTZ) && slotEndTeacherTZ.isAfter(bookedStartTeacherTZ)
      );
    });

    // Find the booked slot details if overlapping
    const bookedSlotDetails = isOverlapping ? bookedSlots.find(b => {
      const bookedStartTeacherTZ = moment.tz(b.startTime, teacherTimezone);
      const bookedEndTeacherTZ = moment.tz(b.endTime, teacherTimezone);
      return (
        slotStartTeacherTZ.isBefore(bookedEndTeacherTZ) && slotEndTeacherTZ.isAfter(bookedStartTeacherTZ)
      );
    }) : null;

    // Include slot if it's not overlapping OR if it's booked by the logged-in student
    const shouldIncludeSlot = !isOverlapping || (studentId && bookedSlotDetails && bookedSlotDetails.bookedBy.toString() === studentId.toString());

    if (shouldIncludeSlot) {
      // Generate and display slots strictly in teacher's timezone
      // No UTC conversions for teacher requests - use teacher availability directly
      let displayStartTime, displayEndTime;
      
      if (studentId) {
        // Student request - convert to student timezone
        const slotStartStudentTZ = slotStartTeacherTZ.tz(studentTimezone);
        const slotEndStudentTZ = slotEndTeacherTZ.tz(studentTimezone);
        
        displayStartTime = slotStartStudentTZ.format("HH:mm");
        displayEndTime = slotEndStudentTZ.format("HH:mm");
      } else {
        // Teacher request - display exactly as per teacher availability, no UTC conversion
        displayStartTime = slotStartTeacherTZ.format("HH:mm");
        displayEndTime = slotEndTeacherTZ.format("HH:mm");
      }

      slots.push({
        startTime: displayStartTime,
        endTime: displayEndTime,
        // Store teacher timezone times directly for consistency
        teacherStart: slotStartTeacherTZ.toDate(),
        teacherEnd: slotEndTeacherTZ.toDate(),
        // Add status information
        status: isOverlapping ? 'booked' : 'available',
        bookedBy: bookedSlotDetails ? bookedSlotDetails.bookedBy : null,
        bookedAt: bookedSlotDetails ? bookedSlotDetails.bookedAt : null
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

