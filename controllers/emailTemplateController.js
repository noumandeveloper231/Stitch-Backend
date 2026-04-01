const asyncHandler = require("../middleware/asyncHandler");
const {
  listTemplates,
  getTemplateByKey,
  updateTemplateByKey,
} = require("../services/emailTemplateService");

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
