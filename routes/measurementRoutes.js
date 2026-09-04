const router = require("express").Router();
const { requireAuth } = require("../middleware/authMiddleware");
const {
  validateBody,
  validateQuery,
  validateParams,
} = require("../middleware/validate");
const Joi = require("joi");
const {
  measurementCreateSchema,
  measurementUpdateSchema,
  measurementListQuerySchema,
  measurementIdParams,
} = require("../validators/schemas");
const {
  createMeasurement,
  getMeasurements,
  getMeasurementById,
  getLatestForCustomer,
  updateMeasurement,
  deleteMeasurement,
} = require("../controllers/measurementController");

const customerIdParamSchema = Joi.object({
  customerId: Joi.string().hex().length(24).required(),
});

router.use(requireAuth);

router.get(
  "/latest/:customerId",
  validateParams(customerIdParamSchema),
  getLatestForCustomer,
);
router.get("/", validateQuery(measurementListQuerySchema), getMeasurements);
router.get("/:id", validateParams(measurementIdParams), getMeasurementById);
router.post("/", validateBody(measurementCreateSchema), createMeasurement);
router.put(
  "/:id",
  validateParams(measurementIdParams),
  validateBody(measurementUpdateSchema),
  updateMeasurement,
);
router.delete(
  "/:id",
  validateParams(measurementIdParams),
  deleteMeasurement,
);

module.exports = router;
