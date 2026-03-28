const asyncHandler = require("../middleware/asyncHandler");
const { getAlerts } = require("../services/notificationService");

exports.list = asyncHandler(async (req, res) => {
  const data = await getAlerts();
  res.json({ data });
});
