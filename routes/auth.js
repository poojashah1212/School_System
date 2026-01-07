const express = require("express");
const router = express.Router();

const authController = require("../controllers/authController");
const { runValidation } = require("../middleware/validate");
const { getSignupValidation, getLoginValidation } = require("../services/validationCacheService");
const upload = require("../middleware/upload");

router.post(
  "/signup",
  upload.fields([
    { name: "profileImage", maxCount: 1 },
    { name: "profile", maxCount: 1 },
    { name: "avatar", maxCount: 1 }
  ]),
  getSignupValidation(),
  runValidation,
  authController.signup
);

router.post(
  "/login",
  getLoginValidation(),
  runValidation,
  authController.login
);

router.put(
  "/update-profile",
  require("../middleware/auth"),
  require("../middleware/upload").fields([
    { name: "profileImage", maxCount: 1 },
    { name: "profile", maxCount: 1 },
    { name: "avatar", maxCount: 1 },
    { name: "image", maxCount: 1 }
  ]),
  authController.updateProfile
);

module.exports = router;
