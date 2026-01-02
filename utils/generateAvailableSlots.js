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

  let current = moment.tz(
    `${moment(date).format("DD-MM-YYYY")} ${availability.startTime}`,
    "DD-MM-YYYY HH:mm",
    teacherTimezone
  );

  const end = moment.tz(
    `${moment(date).format("DD-MM-YYYY")} ${availability.endTime}`,
    "DD-MM-YYYY HH:mm",
    teacherTimezone
  );

  while (
    current.clone().add(sessionDuration, "minutes").isSameOrBefore(end)
  ) {
    const slotStartTeacherTZ = current.clone();
    const slotEndTeacherTZ = slotStartTeacherTZ
      .clone()
      .add(sessionDuration, "minutes");

    const slotStartUTC = slotStartTeacherTZ.clone().utc();
    const slotEndUTC = slotEndTeacherTZ.clone().utc();

    const isOverlapping = bookedSlots.some(b => {
      return (
        slotStartUTC.toDate() < b.endTime &&
        slotEndUTC.toDate() > b.startTime
      );
    });

    if (!isOverlapping) {
      slots.push({
        startTime: slotStartUTC.clone().tz(studentTimezone).format("HH:mm"),
        endTime: slotEndUTC.clone().tz(studentTimezone).format("HH:mm")
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

