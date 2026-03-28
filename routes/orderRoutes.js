const router = require("express").Router();
const { requireAuth, requireRole } = require("../middleware/authMiddleware");
const {
  validateBody,
  validateQuery,
  validateParams,
} = require("../middleware/validate");
const {
  orderCreateSchema,
  orderUpdateSchema,
  orderStatusSchema,
  orderListQuerySchema,
  orderIdParams,
} = require("../validators/schemas");
const {
  createOrder,
  getOrders,
  getOrderById,
  downloadInvoicePdf,
  updateOrderStatus,
  updateOrder,
  deleteOrder,
} = require("../controllers/orderController");

router.use(requireAuth);

router.post("/", validateBody(orderCreateSchema), createOrder);
router.get("/", validateQuery(orderListQuerySchema), getOrders);
router.get(
  "/:id/invoice/pdf",
  validateParams(orderIdParams),
  downloadInvoicePdf,
);
router.get("/:id", validateParams(orderIdParams), getOrderById);
router.patch(
  "/:id/status",
  validateParams(orderIdParams),
  validateBody(orderStatusSchema),
  updateOrderStatus,
);
router.put(
  "/:id",
  validateParams(orderIdParams),
  validateBody(orderUpdateSchema),
  updateOrder,
);
router.delete(
  "/:id",
  requireRole("admin"),
  validateParams(orderIdParams),
  deleteOrder,
);

module.exports = router;
