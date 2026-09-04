const asyncHandler = require("../middleware/asyncHandler");
const { getHistory, deleteHistoryById } = require("../services/historyService");

exports.getLoginHistory = asyncHandler(async (req, res) => {
  const history = await getHistory();
  res.json({ data: history });
});

exports.getUserHistory = asyncHandler(async (req, res) => {
  const history = await getHistory({ userId: req.params.id });
  res.json({ data: history });
});

exports.deleteHistoryEntry = asyncHandler(async (req, res) => {
  const deleted = await deleteHistoryById(req.params.id);
  if (!deleted) {
    const err = new Error("History entry not found");
    err.statusCode = 404;
    throw err;
  }
  res.json({ message: "History entry deleted" });
});
