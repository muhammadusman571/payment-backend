const express = require("express");
const router = express.Router();

const notificationController = require("../controllers/notificationController");
const adminAuth = require("../middleware/adminAuth");

router.get("/unread-count", adminAuth, notificationController.getUnreadCount);
router.get("/all", adminAuth, notificationController.getNotification);
router.post(
  "/mark-all-read",
  adminAuth,
  notificationController.notificationMarkAllRead
);

module.exports = router;
