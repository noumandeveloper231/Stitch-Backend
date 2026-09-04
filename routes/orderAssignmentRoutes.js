const router = require("express").Router({ mergeParams: true });
const { requireAuth } = require("../middleware/authMiddleware");
const { checkPermission } = require("../middleware/rbac");
const ctrl = require("../controllers/orderAssignmentController");

router.use(requireAuth);

router.get("/", checkPermission("Orders", "show"), ctrl.getOrderAssignments);
router.put("/", checkPermission("Orders", "manage"), ctrl.replaceOrderAssignments);
router.patch("/:assignmentId", checkPermission("Orders", "manage"), ctrl.updateAssignment);

module.exports = router;
