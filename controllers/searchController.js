const asyncHandler = require("../middleware/asyncHandler");
const { globalSearch } = require("../services/searchService");

exports.search = asyncHandler(async (req, res) => {
  const { q, limit } = req.query;
  const data = await globalSearch(q, limit);
  res.json({ data });
});
