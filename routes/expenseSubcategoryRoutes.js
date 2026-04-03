const router = require("express").Router();
const { requireAuth } = require("../middleware/authMiddleware");
const { checkPermission } = require("../middleware/rbac");
const { validateBody, validateParams, validateQuery } = require("../middleware/validate");
const {
  expenseSubcategoryCreateSchema,
  expenseSubcategoryUpdateSchema,
  expenseSubcategoryListQuerySchema,
} = require("../validators/schemas");
const Joi = require("joi");
const {
  getExpenseSubcategories,
  createExpenseSubcategory,
  updateExpenseSubcategory,
  deleteExpenseSubcategory,
} = require("../controllers/expenseSubcategoryController");

const expenseSubcategoryIdParams = Joi.object({
  id: Joi.string().hex().length(24).required(),
});

router.use(requireAuth);

router.get("/", checkPermission("Expense Subcategory", "show"), validateQuery(expenseSubcategoryListQuerySchema), getExpenseSubcategories);
router.post("/", checkPermission("Expense Subcategory", "create"), validateBody(expenseSubcategoryCreateSchema), createExpenseSubcategory);
router.put(
  "/:id",
  checkPermission("Expense Subcategory", "manage"),
  validateParams(expenseSubcategoryIdParams),
  validateBody(expenseSubcategoryUpdateSchema),
  updateExpenseSubcategory,
);
router.delete(
  "/:id",
  checkPermission("Expense Subcategory", "delete"),
  validateParams(expenseSubcategoryIdParams),
  deleteExpenseSubcategory,
);

module.exports = router;
