const express = require("express");
const router = express.Router();

const authController = require("../controllers/authController");
const { runValidation } = require("../middleware/validate");
const { getSignupValidation, getLoginValidation } = require("../services/validationCacheService");
const upload = require("../middleware/upload");
const auth = require("../middleware/auth");

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

router.get(
  "/profile",
  auth,
  authController.getProfile
);

router.put(
  "/update-profile",
  auth,
  upload.fields([
    { name: "profileImage", maxCount: 1 },
    { name: "profile", maxCount: 1 },
    { name: "avatar", maxCount: 1 },
    { name: "image", maxCount: 1 }
  ]),
  authController.updateProfile
);

module.exports = router;
