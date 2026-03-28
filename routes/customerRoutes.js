const router = require("express").Router();
const { requireAuth, requireRole } = require("../middleware/authMiddleware");
const {
  validateBody,
  validateQuery,
  validateParams,
} = require("../middleware/validate");
const {
  customerCreateSchema,
  customerUpdateSchema,
  customerListQuerySchema,
  customerIdParams,
} = require("../validators/schemas");
const {
  addCustomer,
  getCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
} = require("../controllers/customerController");

router.use(requireAuth);

router.get("/", validateQuery(customerListQuerySchema), getCustomers);
router.get("/:id", validateParams(customerIdParams), getCustomerById);
router.post("/", validateBody(customerCreateSchema), addCustomer);
router.put(
  "/:id",
  validateParams(customerIdParams),
  validateBody(customerUpdateSchema),
  updateCustomer,
);
router.delete(
  "/:id",
  requireRole("admin"),
  validateParams(customerIdParams),
  deleteCustomer,
);

module.exports = router;
