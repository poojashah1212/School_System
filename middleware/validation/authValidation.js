const { body } = require("express-validator");

exports.signupValidation = [
  body("fullName").notEmpty().withMessage("Full name is required"),
  body("email").isEmail().withMessage("Valid email required"),
  body("password").isLength({ min: 6 }).withMessage("Password too short")
];

exports.loginValidation = [
  body("email").isEmail(),
  body("password").notEmpty()
];
