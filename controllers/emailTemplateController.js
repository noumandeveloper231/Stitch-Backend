const asyncHandler = require("../middleware/asyncHandler");
const User = require("../models/User");
const {
  listTemplates,
  getTemplateByKey,
  updateTemplateByKey,
} = require("../services/emailTemplateService");
const { sendTestTemplatedEmail } = require("../services/emailSenderService");
const { EMAIL_TEMPLATE_SAMPLE_VARIABLES } = require("../services/emailTemplateSampleVariables");

exports.getEmailTemplates = asyncHandler(async (req, res) => {
  const data = await listTemplates();
  res.json({ data });
});

exports.getEmailTemplate = asyncHandler(async (req, res) => {
  const data = await getTemplateByKey(req.params.key);
  if (!data) {
    const err = new Error("Template not found");
    err.statusCode = 404;
    throw err;
  }
  res.json({ data });
});

exports.updateEmailTemplate = asyncHandler(async (req, res) => {
  const data = await updateTemplateByKey(req.params.key, req.body);
  res.json({ data });
});

exports.sendTestEmail = asyncHandler(async (req, res) => {
  if (!process.env.RESEND_API_KEY) {
    const err = new Error("Email sending is not configured (missing RESEND_API_KEY)");
    err.statusCode = 503;
    throw err;
  }

  const user = await User.findById(req.user.id).select("email").lean();
  const to = user?.email?.trim();
  if (!to) {
    const err = new Error("Your account has no email address");
    err.statusCode = 400;
    throw err;
  }

  const result = await sendTestTemplatedEmail({
    templateKey: req.params.key,
    to,
    variables: EMAIL_TEMPLATE_SAMPLE_VARIABLES,
  });

  if (result?.error) {
    const err = new Error(result.error.message || "Failed to send test email");
    err.statusCode = 502;
    throw err;
  }

  res.json({
    data: {
      ok: true,
      to,
      messageId: result?.data?.id ?? null,
    },
  });
});
