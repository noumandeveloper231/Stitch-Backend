const router = require("express").Router();
const { validateBody } = require("../middleware/validate");
const { requireEmployeeAuth } = require("../middleware/employeeAuthMiddleware");
const {
  login,
  changePassword,
  refresh,
  logout,
  me,
  myTasks,
} = require("../controllers/employeeAuthController");
const {
  loginSchema,
  refreshSchema,
  logoutSchema,
} = require("../validators/schemas");

router.post("/login", validateBody(loginSchema), login);
router.post("/change-password", requireEmployeeAuth, changePassword);
router.post("/refresh", validateBody(refreshSchema), refresh);
router.post("/logout", validateBody(logoutSchema), logout);
router.get("/me", requireEmployeeAuth, me);
router.get("/tasks", requireEmployeeAuth, myTasks);

module.exports = router;
