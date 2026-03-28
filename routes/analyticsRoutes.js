const router = require("express").Router();
const { requireAuth } = require("../middleware/authMiddleware");
const { validateQuery } = require("../middleware/validate");
const { analyticsQuerySchema } = require("../validators/schemas");
const { dashboard } = require("../controllers/analyticsController");

router.use(requireAuth);
router.get("/dashboard", validateQuery(analyticsQuerySchema), dashboard);

module.exports = router;
