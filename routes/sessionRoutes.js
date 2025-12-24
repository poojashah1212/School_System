const express = require("express");
const jwtAuth = require("../middleware/auth");
const roleAuth = require("../middleware/roleAuth");
const {
  createSession,
  getStudentSessions
} = require("../controllers/sessionController");

const {
  createSessionValidation,
  validateSession
} = require("../middleware/validation/sessionValidation");
const { runValidation } = require("../middleware/validate");

const router = express.Router();

router.post(
  "/",
  jwtAuth,
  roleAuth("teacher"),
  createSessionValidation,
  validateSession,
  runValidation,
  createSession
);

router.get(
  "/student",
  jwtAuth,
  roleAuth("student"),
  getStudentSessions
);

module.exports = router;
