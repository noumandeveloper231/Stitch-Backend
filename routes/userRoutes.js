const router = require("express").Router();
const { requireAuth } = require("../middleware/authMiddleware");
const { checkPermission } = require("../middleware/rbac");
const {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
} = require("../controllers/userController");

router.use(requireAuth);

router.get("/", checkPermission("Users", "show"), getUsers);
router.post("/", checkPermission("Users", "create"), createUser);
router.put("/:id", checkPermission("Users", "manage"), updateUser);
router.delete("/:id", checkPermission("Users", "delete"), deleteUser);

module.exports = router;
