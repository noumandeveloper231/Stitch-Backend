const router = require("express").Router();
const { requireAuth } = require("../middleware/authMiddleware");
const { checkPermission } = require("../middleware/rbac");
const { validateBody, validateParams, validateQuery } = require("../middleware/validate");
const {
  expenseCreateSchema,
  expenseUpdateSchema,
  expenseListQuerySchema,
  expenseReceiptUploadSchema,
} = require("../validators/schemas");
const Joi = require("joi");
const {
  getNextExpenseNumber,
  uploadReceipt,
  getExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
} = require("../controllers/expenseController");

const expenseIdParams = Joi.object({
  id: Joi.string().hex().length(24).required(),
});

router.use(requireAuth);

router.post("/upload-receipt", checkPermission("Expenses", "create"), validateBody(expenseReceiptUploadSchema), uploadReceipt);
router.get("/next-number", checkPermission("Expenses", "show"), getNextExpenseNumber);
router.get("/", checkPermission("Expenses", "show"), validateQuery(expenseListQuerySchema), getExpenses);
router.post("/", checkPermission("Expenses", "create"), validateBody(expenseCreateSchema), createExpense);
router.put(
  "/:id",
  checkPermission("Expenses", "manage"),
  validateParams(expenseIdParams),
  validateBody(expenseUpdateSchema),
  updateExpense,
);
router.delete("/:id", checkPermission("Expenses", "delete"), validateParams(expenseIdParams), deleteExpense);

module.exports = router;
