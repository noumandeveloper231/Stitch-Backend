const router = require("express").Router();
const { requireAuth } = require("../middleware/authMiddleware");
const { validateQuery } = require("../middleware/validate");
const { searchQuerySchema } = require("../validators/schemas");
const { search } = require("../controllers/searchController");

router.use(requireAuth);
router.get("/", validateQuery(searchQuerySchema), search);

module.exports = router;
