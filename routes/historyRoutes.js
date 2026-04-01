const router = require("express").Router();
const { requireAuth } = require("../middleware/authMiddleware");
const { checkPermission } = require("../middleware/rbac");
const {
  getLoginHistory,
  getUserHistory,
  deleteHistoryEntry,
} = require("../controllers/historyController");

router.use(requireAuth);

router.get("/", checkPermission("Dashboard", "show"), getLoginHistory); // Dashboard permission needed for history
router.get("/user/:id", checkPermission("Users", "show"), getUserHistory);
router.delete("/:id", checkPermission("Dashboard", "manage"), deleteHistoryEntry);

module.exports = router;
