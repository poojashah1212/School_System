const { body, validationResult } = require("express-validator"); 
const moment = require("moment");

exports.createSessionSlotsValidation = [
  body("title")
    .trim()
    .notEmpty()
    .withMessage("Session title is required")
    .isLength({ min: 3, max: 100 })
    .withMessage("Session title must be between 3 and 100 characters"),
    
  body("date")
    .notEmpty()
    .withMessage("Session date is required")
    .custom(value => {
      const parsed = moment(value, "DD-MM-YYYY", true);
      if (!parsed.isValid()) {
        throw new Error("Date must be in DD-MM-YYYY format (e.g., 25-12-2023)");
      }
      if (parsed.isBefore(moment().startOf("day"))) {
        throw new Error("Session date must be today or in the future");
      }
      return true;
    }),

  body("sessionDuration")
    .optional()
    .isInt({ min: 15, max: 240 })
    .withMessage("Session duration must be between 15 and 240 minutes"),
    
  body("breakDuration")
    .optional()
    .isInt({ min: 0, max: 120 })
    .withMessage("Break duration must be between 0 and 120 minutes"),
    
  body("student_id")
    .optional()
    .isMongoId()
    .withMessage("Student ID must be valid")
];

exports.confirmSessionSlotValidation = [
  body("sessionId")
    .notEmpty()
    .withMessage("Session ID is required")
    .isMongoId()
    .withMessage("Session ID must be valid"),
    
  body("startTime")
    .notEmpty()
    .withMessage("Start time is required")
    .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .withMessage("Start time must be in HH:MM format (e.g., 09:30)"),
    
  body("date")
    .notEmpty()
    .withMessage("Date is required")
    .custom(value => {
      const parsed = moment(value, "DD-MM-YYYY", true);
      if (!parsed.isValid()) {
        throw new Error("Date must be in DD-MM-YYYY format (e.g., 25-12-2023)");
      }
      return true;
    })
];

exports.validateSessionSlot = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // Return the first validation error for better user experience
    const firstError = errors.array()[0];
    return res.status(400).json({
      message: firstError.msg,
      field: firstError.param
    });
  }
  next();
};
