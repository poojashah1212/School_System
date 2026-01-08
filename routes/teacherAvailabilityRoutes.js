const express = require("express");
const jwtAuth = require("../middleware/auth");
const roleAuth = require("../middleware/roleAuth");

const {
  setWeeklyAvailability,
  getWeeklyAvailability,
  addHoliday,
  getHolidays,
  getTeacherAvailabilityForStudent
} = require("../controllers/teacherAvailabilityController");

const {weeklyAvailabilityValidation, addHolidayValidation} = require("../middleware/validation/availabilityValidation");
const { runValidation } = require("../middleware/validate");
const router = express.Router();

router.get(
  "/availability",
  jwtAuth,
  roleAuth("teacher"),
  getWeeklyAvailability
);

router.post(
  "/availability",
  jwtAuth,
  roleAuth("teacher"),
  weeklyAvailabilityValidation,
  runValidation,
  setWeeklyAvailability
);

router.post(
  "/holidays",
  jwtAuth,
  roleAuth("teacher"),
  addHolidayValidation,
  runValidation,
  addHoliday
);

router.get(
  "/holidays",
  jwtAuth,
  roleAuth("teacher"),
  getHolidays
);

router.get(
  "/:teacherId",
  jwtAuth,
  roleAuth("student"),
  getTeacherAvailabilityForStudent
);

module.exports = router;
