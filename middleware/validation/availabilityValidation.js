const { body } = require("express-validator");

const DAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday"
];

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
const dateRegex = /^\d{2}-\d{2}-\d{4}$/;

exports.weeklyAvailabilityValidation = [
  body("weeklyAvailability")
    .exists().withMessage("weeklyAvailability is required")
    .isArray({ min: 1 }).withMessage("weeklyAvailability must be a non-empty array"),

  body("weeklyAvailability").custom((value) => {
    const usedDays = new Set();

    for (let i = 0; i < value.length; i++) {
      const slot = value[i];

      if (!slot.day) {
        throw new Error(`day is required at index ${i}`);
      }

      const day = slot.day.toLowerCase();

      if (!DAYS.includes(day)) {
        throw new Error(
          `Invalid day '${slot.day}'. Allowed: ${DAYS.join(", ")}`
        );
      }

      if (usedDays.has(day)) {
        throw new Error(`Duplicate day '${day}' is not allowed`);
      }
      usedDays.add(day);

      if (!slot.startTime || !timeRegex.test(slot.startTime)) {
        throw new Error(`Invalid startTime at index ${i}`);
      }

      if (!slot.endTime || !timeRegex.test(slot.endTime)) {
        throw new Error(`Invalid endTime at index ${i}`);
      }

      if (slot.startTime >= slot.endTime) {
        throw new Error(`endTime must be greater than startTime for ${day}`);
      }
    }
    return true;
  })
];


exports.addHolidayValidation = [
  body("startDate")
    .exists().withMessage("startDate is required")
    .matches(dateRegex).withMessage("startDate must be DD-MM-YYYY"),

  body("endDate")
    .exists().withMessage("endDate is required")
    .matches(dateRegex).withMessage("endDate must be DD-MM-YYYY"),

  body("reason")
    .exists().withMessage("reason is required")
    .trim()
    .toLowerCase()
    .isIn(["personal", "public"])
    .withMessage("reason must be personal or public"),

  body("note")
    .optional()
    .isString().withMessage("note must be a string"),

  body().custom(({ startDate, endDate }) => {
    const [sd, sm, sy] = startDate.split("-").map(Number);
    const [ed, em, ey] = endDate.split("-").map(Number);

    const start = new Date(sy, sm - 1, sd);
    const end = new Date(ey, em - 1, ed);

    if (end < start) {
      throw new Error("endDate cannot be before startDate");
    }
    return true;
  })
];
