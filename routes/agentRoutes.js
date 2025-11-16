const express = require("express");
const router = express.Router();
const ticketController = require("../controllers/ticketController");
const upload = require("../middleware/upload");
const gameController = require("../controllers/gameController");
const adminAuth = require("../middleware/adminAuth");

// Ticket routes
router.post("/tickets/create", upload.single("file"), ticketController.create);
router.post("/tickets/list", ticketController.list);

router.get("/game/list", adminAuth, gameController.agentRateList);

module.exports = router;
