const router = require("express").Router();
const { requireAuth } = require("../middleware/authMiddleware");
const { list } = require("../controllers/notificationController");

router.use(requireAuth);
router.get("/", list);

module.exports = router;
