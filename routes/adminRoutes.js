const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
// const adminAuth = require('../middleware/adminAuth');
const authMiddleware = require("../middleware/adminAuth"); // ✅ FIXED
const agentController = require("../controllers/agentController");
const gameController = require("../controllers/gameController");

const paymentCommissionController = require("../controllers/paymentCommissionController");
const agentCheckoutController = require("../controllers/agentCheckoutController");

//const ticketController = require("../controllers/ticketController");
const QueryController = require("../controllers/queryController");
const QueryMessageController = require("../controllers/queryMessageController");
const upload = require("../middleware/upload");
const adminAuth = require("../middleware/adminAuth");

// Public routes
router.post("/login", adminController.login);
router.post("/super/login", adminController.superLogin);

// Protected routes
router.post("/agentProfile", adminController.agentProfile);
router.post("/agentProfilebyid", adminController.agentProfileById);

//staff routes
router.post("/staffprofile", adminController.getProfile);

//settings address routes
router.get("/settings", adminController.getAllSettings);
router.post("/settings_edit", adminController.editSetting);
router.post("/settings", upload.single("file"), adminController.createSetting);

//dashboard routes
router.post("/dashboard", adminAuth, adminController.dashboardStats);
router.post(
  "/dashboard/deposit-graph",
  adminAuth,
  adminController.dashboardDepositGraph
);

//agent routes
router.post("/agent/create", agentController.create);
router.post("/agent/list", adminAuth, agentController.list);
router.post("/agent/analytical", adminAuth, agentController.agentAnalytical);
router.post("/agent/detail-analytics", adminAuth, agentController.detailReport);
router.post("/agent/update-values", agentController.updatePercentage);

router.post("/agent/edit", agentController.edit);
router.post("/agent/delete", agentController.delete);
router.post("/changePassword", agentController.changePassword);

// Add game
router.post("/game/details", gameController.details);
router.post("/game/create", upload.single("logo"), gameController.add);
router.get("/game/list", adminAuth, gameController.list);
router.post("/game/edit", upload.single("logo"), gameController.edit);
router.post("/game/delete", gameController.delete);
router.patch("/game/change-game-status/:id", gameController.changeGameStatus);
router.get("/game/showactivegames", gameController.showActiveGames);

router.get("/agentCheckoutpage/list/:id", agentCheckoutController.list);
router.post("/agentCheckoutpage/create", agentCheckoutController.addOrUpdate);

// paymentCommissionController
router.post("/add-commission", paymentCommissionController.addCommission);

// Get all commissions
router.post(
  "/payout-history",
  adminAuth,
  paymentCommissionController.getAllPayoutHistory
);
router.post(
  "/add-payout-history",
  paymentCommissionController.addPayoutHistory
);

router.post(
  "/update-payout-history",
  paymentCommissionController.updatePayoutHistory
);
router.post(
  "/delete-payout-history",
  paymentCommissionController.deletePayoutHistory
);

router.post(
  "/payment/update-status",
  paymentCommissionController.updatePaymentStatus
);
router.post(
  "/commission-summary",
  paymentCommissionController.getAgentCommissionSummary
);
router.post("/agent/payout", paymentCommissionController.payoutToAgent);

// Ticket message routes

router.post("/query/create", upload.single("file"), QueryController.add);
//router.post("/query/createnew", upload.single("file"), QueryController.addNew);
router.post("/query/list", QueryController.list);
router.post("/query/listbyid", QueryController.listById);
router.post("/query/listbyidonly", QueryController.listByIdOnly);
router.post("/query/listbyticketid", QueryController.listByTicketId);
router.post("/query/edit", QueryController.edit);
router.post("/query/delete", QueryController.delete);
router.post("/query/close", QueryController.close);

router.post(
  "/querymessage/create",
  upload.single("file"),
  QueryMessageController.create
);
//router.post("/querymessage/createnew", upload.single("file"),QueryMessageController.createNew);
router.post("/querymessage/listbyid", QueryMessageController.list);
router.post("/querymessage/list", QueryMessageController.list);
router.get("/rate/list", gameController.rateList);
router.post("/rate/update", gameController.updateRateList);

router.get("/rate/list-by-id/", authMiddleware, gameController.rateListById);

module.exports = router;
