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
  console.log('generateAvailableSlots - studentTimezone:', studentTimezone);
  console.log('generateAvailableSlots - teacherTimezone:', teacherTimezone);
  
  const studentRedisKey = `slots:student:${studentId}:${sessionId}:${moment(date).format("YYYY-MM-DD")}:${availability.startTime}-${availability.endTime}:${studentTimezone}`;

  const teacherRedisKey = `slots:teacher:${teacherId}:${sessionId}:${moment(date).format("YYYY-MM-DD")}:${availability.startTime}-${availability.endTime}:${teacherTimezone}`;

  const studentCached = await redisClient.get(studentRedisKey);
  if (studentCached) {
    console.log("Student Cache HIT:", studentRedisKey);
    return JSON.parse(studentCached);
  }

  const teacherCached = await redisClient.get(teacherRedisKey);
  if (teacherCached) {
    console.log("Teacher Cache HIT:", teacherRedisKey);
    return JSON.parse(teacherCached);
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

  let current = teacherStartDateTime;
  const end = teacherEndDateTime;

  while (
    current.clone().add(sessionDuration, "minutes").isSameOrBefore(end)
  ) {
    const slotStartTeacherTZ = current.clone();
    const slotEndTeacherTZ = slotStartTeacherTZ
      .clone()
      .add(sessionDuration, "minutes");

    // Convert to UTC first, then to student timezone
    const slotStartUTC = slotStartTeacherTZ.utc();
    const slotEndUTC = slotEndTeacherTZ.utc();

    console.log('Slot conversion:');
    console.log('  Teacher time:', slotStartTeacherTZ.format(), '-', slotEndTeacherTZ.format());
    console.log('  UTC time:', slotStartUTC.format(), '-', slotEndUTC.format());

    // Convert UTC times to student timezone
    const slotStartStudentTZ = slotStartUTC.tz(studentTimezone);
    const slotEndStudentTZ = slotEndUTC.tz(studentTimezone);

    console.log('  Student time:', slotStartStudentTZ.format(), '-', slotEndStudentTZ.format());

    const isOverlapping = bookedSlots.some(b => {
      return (
        slotStartUTC.toDate() < b.endTime &&
        slotEndUTC.toDate() > b.startTime
      );
    });

    if (!isOverlapping) {
      // Return times in Asia/Kolkata (storage timezone) for frontend conversion
      const startTimeFormatted = slotStartTeacherTZ.format("HH:mm");
      const endTimeFormatted = slotEndTeacherTZ.format("HH:mm");
      
      console.log('  Final formatted slot (Asia/Kolkata):', startTimeFormatted, '-', endTimeFormatted);
      
      slots.push({
        startTime: startTimeFormatted,
        endTime: endTimeFormatted
      });
    }

    current = slotEndTeacherTZ.clone().add(breakDuration, "minutes");
  }
 await redisClient.setEx(
    studentRedisKey,
    60 * 60 * 24,
    JSON.stringify(slots)
  );

  await redisClient.setEx(
    teacherRedisKey,
    60 * 60 * 24,
    JSON.stringify(slots)
  );

  return slots;
};

module.exports = generateAvailableSlots;

