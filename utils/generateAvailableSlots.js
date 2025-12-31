const moment = require("moment-timezone");

const generateAvailableSlots = ({
  date,
  availability,
  sessionDuration,
  breakDuration,
  bookedSlots = [],
  teacherTimezone,
  studentTimezone
}) => {
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

  return slots;
};

module.exports = generateAvailableSlots;

