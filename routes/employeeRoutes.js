const router = require("express").Router();
const { requireAuth } = require("../middleware/authMiddleware");
const { checkPermission } = require("../middleware/rbac");
const {
  getEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
} = require("../controllers/employeeController");

router.use(requireAuth);

router.get("/", checkPermission("Employees", "show"), getEmployees);
router.post("/", checkPermission("Employees", "create"), createEmployee);
router.put("/:id", checkPermission("Employees", "manage"), updateEmployee);
router.delete("/:id", checkPermission("Employees", "delete"), deleteEmployee);

module.exports = router;
