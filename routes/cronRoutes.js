const express = require("express");
const router = express.Router();
const asyncHandler = require("../middleware/asyncHandler");
const { syncAutoPriorities, sendOverdueAlerts } = require("../services/priorityService");

router.get("/trigger-alerts", asyncHandler(async (req, res) => {

  console.log("Cron Ran for the priority");
  // 1. Sync auto priorities
  const updatedCount = await syncAutoPriorities();
  
  // 2. Send alerts for overdue orders
  const alertResult = await sendOverdueAlerts();
  
  res.json({
    success: true,
    updatedPriorities: updatedCount,
    alertsSent: alertResult.sent
  });
}));

module.exports = router;
