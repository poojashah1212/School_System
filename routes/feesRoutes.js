const express = require("express");
const router = express.Router();
const feesController = require("../controllers/admin/FeesController");
const auth = require("../middleware/auth");
const roleAuth = require("../middleware/roleAuth");

router.post("/define", auth, roleAuth("admin"), feesController.defineFees);
router.get("/list", auth, roleAuth("admin"), feesController.getClassFees);
router.get("/list-all", auth, roleAuth("admin"), feesController.getAllPayments);
router.get("/class-payment-status", auth, roleAuth("admin"), feesController.getClassWisePaymentStatus);
router.post("/update-status", auth, roleAuth("admin"), feesController.updatePaymentStatus);
router.get("/my-fees", auth, roleAuth("student"), feesController.getStudentFees);
router.post("/record-payment", auth, roleAuth("student"), feesController.recordPayment);
router.get("/payment-history", auth, roleAuth("student"), feesController.getStudentPayments);

module.exports = router;
