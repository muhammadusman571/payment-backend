const express = require("express");
const router = express.Router();
const announcementController = require("../controllers/announcementController");
const adminAuth = require("../middleware/adminAuth");

// Announcement routes
router.post("/create", announcementController.create);
router.get("/list", adminAuth, announcementController.getAll);
router.put("/edit/:id", announcementController.edit);
router.delete("/delete/:id", announcementController.delete);

module.exports = router;
