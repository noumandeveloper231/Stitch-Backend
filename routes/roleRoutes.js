const router = require("express").Router();
const { requireAuth } = require("../middleware/authMiddleware");
const { checkPermission } = require("../middleware/rbac");
const { validateBody, validateParams } = require("../middleware/validate");
const { roleCreateSchema, roleUpdateSchema } = require("../validators/schemas");
const Joi = require("joi");
const {
  getRoles,
  createRole,
  updateRole,
  deleteRole,
} = require("../controllers/roleController");

router.use(requireAuth);
const roleIdParams = Joi.object({ id: Joi.string().hex().length(24).required() });

router.get("/", checkPermission("Roles", "show"), getRoles);
router.post("/", checkPermission("Roles", "create"), validateBody(roleCreateSchema), createRole);
router.put(
  "/:id",
  checkPermission("Roles", "manage"),
  validateParams(roleIdParams),
  validateBody(roleUpdateSchema),
  updateRole,
);
router.delete("/:id", checkPermission("Roles", "delete"), validateParams(roleIdParams), deleteRole);

module.exports = router;
