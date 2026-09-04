const router = require("express").Router();
const { requireAuth } = require("../middleware/authMiddleware");
const {
  validateBody,
  validateQuery,
  validateParams,
} = require("../middleware/validate");
const {
  customerNoteCreateSchema,
  customerNoteUpdateSchema,
  customerNoteListQuerySchema,
  noteIdParams,
} = require("../validators/schemas");
const {
  createCustomerNote,
  getCustomerNotes,
  updateCustomerNote,
  deleteCustomerNote,
} = require("../controllers/customerNoteController");

router.use(requireAuth);

router.get("/", validateQuery(customerNoteListQuerySchema), getCustomerNotes);
router.post("/", validateBody(customerNoteCreateSchema), createCustomerNote);
router.patch(
  "/:id",
  validateParams(noteIdParams),
  validateBody(customerNoteUpdateSchema),
  updateCustomerNote,
);
router.delete("/:id", validateParams(noteIdParams), deleteCustomerNote);

module.exports = router;
