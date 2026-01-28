const express = require("express");
const jwtAuth = require("../middleware/auth");
const roleAuth = require("../middleware/roleAuth");
const {createSession,getStudentSessions} = require("../controllers/sessionController");
const { createSessionValidation, validateSession } = require("../middleware/validation/sessionValidation");
const { createSessionSlots,getMySessionSlots,confirmSessionSlot,getMyConfirmedSessions,getTeacherSessions,getSessionById,deleteSession,getAllSlotsForSession,assignSlotToStudent} = require("../controllers/sessionSlotController");
const { createSessionSlotsValidation, confirmSessionSlotValidation, validateSessionSlot} = require("../middleware/validation/sessionSlotValidation");


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

router.get(
  "/mysessions",
  jwtAuth,
  roleAuth("student"),
  getMySessionSlots
);

router.get(
  "/my-confirmed-sessions",
  jwtAuth,
  roleAuth("student"),
  getMyConfirmedSessions
);

router.post("/slots", jwtAuth, roleAuth("teacher"), createSessionSlotsValidation, validateSessionSlot,runValidation,createSessionSlots);
router.get("/teacher",jwtAuth,roleAuth("teacher"),getTeacherSessions);
router.get("/:id/details", jwtAuth, roleAuth("teacher"), getSessionById);
router.get("/:id", jwtAuth, roleAuth("teacher"), getSessionById);
router.get("/:id/all-slots", jwtAuth, roleAuth("teacher"), getAllSlotsForSession);
router.delete("/:id", jwtAuth, roleAuth("teacher"), deleteSession);
router.post("/confirm", jwtAuth, roleAuth("student"), confirmSessionSlotValidation, validateSessionSlot,runValidation,confirmSessionSlot);
router.post("/assign-slot", jwtAuth, roleAuth("teacher"), assignSlotToStudent);

module.exports = router;

