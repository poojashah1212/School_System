const express = require("express");
const router = express.Router();
const {
    createAnnouncement,
    getAnnouncements,
    deleteAnnouncement
} = require("../../controllers/admin/AnnouncementController");

const adminAuth = require("../../middleware/adminAuth");
const auth = require("../../middleware/auth");
const authMiddleware = require("../../middleware/authMiddleware");
router.post("/", adminAuth, createAnnouncement);
router.get("/", authMiddleware, getAnnouncements);
router.delete("/:id", adminAuth, deleteAnnouncement);

module.exports = router;
