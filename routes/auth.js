const express = require("express");
const router = express.Router();

const authController = require("../controllers/authController");
const { runValidation } = require("../middleware/validate");
const {
  signupValidation,
  loginValidation
} = require("../middleware/validation/authValidation");

const upload = require("../middleware/upload");

router.post(
  "/signup",
  upload.fields([
    { name: "profileImage", maxCount: 1 },
    { name: "profile", maxCount: 1 },
    { name: "avatar", maxCount: 1 }
  ]),
  signupValidation,
  runValidation,
  authController.signup
);

router.post(
  "/login",
  loginValidation,
  runValidation,
  authController.login
);

module.exports = router;
