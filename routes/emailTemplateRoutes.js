const router = require("express").Router();
const { requireAuth } = require("../middleware/authMiddleware");
const { checkPermission } = require("../middleware/rbac");
const { validateBody, validateParams } = require("../middleware/validate");
const {
  emailTemplateKeyParams,
  emailTemplateUpdateSchema,
} = require("../validators/schemas");
const {
  getEmailTemplates,
  getEmailTemplate,
  updateEmailTemplate,
  sendTestEmail,
} = require("../controllers/emailTemplateController");

router.use(requireAuth);

router.get("/", checkPermission("Email Templates", "show"), getEmailTemplates);
router.get(
  "/:key",
  checkPermission("Email Templates", "show"),
  validateParams(emailTemplateKeyParams),
  getEmailTemplate,
);
router.put(
  "/:key",
  checkPermission("Email Templates", "manage"),
  validateParams(emailTemplateKeyParams),
  validateBody(emailTemplateUpdateSchema),
  updateEmailTemplate,
);
router.post(
  "/:key/test-send",
  checkPermission("Email Templates", "manage"),
  validateParams(emailTemplateKeyParams),
  sendTestEmail,
);

module.exports = router;
