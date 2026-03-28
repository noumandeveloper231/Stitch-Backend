const router = require("express").Router();
const { validateBody } = require("../middleware/validate");
const { requireAuth } = require("../middleware/authMiddleware");
const {
  registerSchema,
  loginSchema,
  refreshSchema,
  logoutSchema,
} = require("../validators/schemas");
const {
  register,
  login,
  refresh,
  logout,
  me,
} = require("../controllers/authController");

router.post("/register", validateBody(registerSchema), register);
router.post("/login", validateBody(loginSchema), login);
router.post("/refresh", validateBody(refreshSchema), refresh);
router.post("/logout", validateBody(logoutSchema), logout);
router.get("/me", requireAuth, me);

module.exports = router;
