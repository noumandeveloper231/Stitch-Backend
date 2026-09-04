const router = require("express").Router();
const { requireAuth } = require("../middleware/authMiddleware");
const { checkPermission } = require("../middleware/rbac");
const { validateBody, validateParams, validateQuery } = require("../middleware/validate");
const {
  expenseCategoryCreateSchema,
  expenseCategoryUpdateSchema,
  expenseCategoryListQuerySchema,
} = require("../validators/schemas");
const Joi = require("joi");
const {
  getExpenseCategories,
  createExpenseCategory,
  updateExpenseCategory,
  deleteExpenseCategory,
} = require("../controllers/expenseCategoryController");

const expenseCategoryIdParams = Joi.object({
  id: Joi.string().hex().length(24).required(),
});

router.use(requireAuth);

router.get("/", checkPermission("Expense Category", "show"), validateQuery(expenseCategoryListQuerySchema), getExpenseCategories);
router.post("/", checkPermission("Expense Category", "create"), validateBody(expenseCategoryCreateSchema), createExpenseCategory);
router.put(
  "/:id",
  checkPermission("Expense Category", "manage"),
  validateParams(expenseCategoryIdParams),
  validateBody(expenseCategoryUpdateSchema),
  updateExpenseCategory,
);
router.delete(
  "/:id",
  checkPermission("Expense Category", "delete"),
  validateParams(expenseCategoryIdParams),
  deleteExpenseCategory,
);

module.exports = router;
