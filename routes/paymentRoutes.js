const express = require("express");
const router = express.Router();
const {
  getPaymentHistory,
  generateInvoiceLink,
  getInvoice,
  bulkUpdatePayments,
  updatePaymentStatus,
} = require("../controllers/paymentController");
const adminAuth = require("../middleware/adminAuth");

router.post("/history", adminAuth, getPaymentHistory);

router.post("/generate-invoice-link", adminAuth, generateInvoiceLink);
router.get("/get-invoice", getInvoice);
router.post("/bulk-update", bulkUpdatePayments);
router.post("/update-status", updatePaymentStatus);

module.exports = router;
