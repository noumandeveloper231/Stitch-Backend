const asyncHandler = require("../middleware/asyncHandler");
const { getDashboard } = require("../services/analyticsService");

exports.dashboard = asyncHandler(async (req, res) => {
  const data = await getDashboard({
    from: req.query.from,
    to: req.query.to,
  });
  res.json({ data });
});
