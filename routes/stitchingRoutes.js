const router = require("express").Router();
const { requireAuth } = require("../middleware/authMiddleware");
const { checkPermission } = require("../middleware/rbac");
const { validateBody, validateQuery, validateParams } = require("../middleware/validate");
const {
  stitchingTypeCreateSchema,
  stitchingTypeListQuerySchema,
  stitchingTypeUpdateSchema,
  stitchingTypeIdParams,
} = require("../validators/schemas");
const {
  createStitchingType,
  getStitchingTypes,
  updateStitchingType,
  deleteStitchingType,
} = require("../controllers/stitchingTypeController");

router.use(requireAuth);

router.get(
  "/",
  checkPermission("Stitching Types", "show"),
  validateQuery(stitchingTypeListQuerySchema),
  getStitchingTypes,
);
router.post(
  "/",
  checkPermission("Stitching Types", "create"),
  validateBody(stitchingTypeCreateSchema),
  createStitchingType,
);
router.put(
  "/:id",
  checkPermission("Stitching Types", "manage"),
  validateParams(stitchingTypeIdParams),
  validateBody(stitchingTypeUpdateSchema),
  updateStitchingType,
);
router.delete(
  "/:id",
  checkPermission("Stitching Types", "delete"),
  validateParams(stitchingTypeIdParams),
  deleteStitchingType,
);

module.exports = router;
