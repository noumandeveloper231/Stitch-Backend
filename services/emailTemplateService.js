const EmailTemplate = require("../models/EmailTemplate");
const { DEFAULT_EMAIL_TEMPLATES } = require("./emailTemplateDefaults");

const DEFAULT_BY_KEY = new Map(DEFAULT_EMAIL_TEMPLATES.map((t) => [t.key, t]));
const TOKEN_REGEX = /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g;

function normalizePlaceholderToken(token) {
  const match = String(token || "").match(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/);
  return match ? `{{${match[1]}}}` : null;
}

function ensureKnownTemplateKey(key) {
  if (!DEFAULT_BY_KEY.has(key)) {
    const err = new Error("Unknown template key");
    err.statusCode = 400;
    throw err;
  }
}

function interpolateTemplate(content, payload) {
  return String(content || "").replace(TOKEN_REGEX, (_, tokenName) => {
    const raw = payload?.[tokenName];
    return raw === undefined || raw === null ? "" : String(raw);
  });
}

async function ensureDefaultTemplates() {
  for (const defaults of DEFAULT_EMAIL_TEMPLATES) {
    await EmailTemplate.updateOne(
      { key: defaults.key },
      { $setOnInsert: defaults },
      { upsert: true },
    );
  }
}

async function listTemplates() {
  await ensureDefaultTemplates();
  const docs = await EmailTemplate.find({ key: { $in: DEFAULT_EMAIL_TEMPLATES.map((t) => t.key) } })
    .sort({ templateName: 1 })
    .lean();
  return docs;
}

async function getTemplateByKey(key) {
  ensureKnownTemplateKey(key);
  await ensureDefaultTemplates();
  return EmailTemplate.findOne({ key }).lean();
}

async function updateTemplateByKey(key, patch) {
  ensureKnownTemplateKey(key);
  const nextPatch = { ...patch };
  delete nextPatch.key;

  if (Array.isArray(nextPatch.placeholders)) {
    nextPatch.placeholders = nextPatch.placeholders
      .map(normalizePlaceholderToken)
      .filter(Boolean);
  }

  const updated = await EmailTemplate.findOneAndUpdate(
    { key },
    { $set: nextPatch, $inc: { version: 1 } },
    { new: true, runValidators: true },
  ).lean();

  if (!updated) {
    const err = new Error("Template not found");
    err.statusCode = 404;
    throw err;
  }
  return updated;
}

async function renderTemplate(key, variables = {}) {
  ensureKnownTemplateKey(key);
  await ensureDefaultTemplates();
  const stored = await EmailTemplate.findOne({ key }).lean();
  const defaults = DEFAULT_BY_KEY.get(key);
  const activeTemplate = stored && stored.enabled ? stored : defaults;

  return {
    key,
    subject: interpolateTemplate(activeTemplate.subject, variables),
    body: interpolateTemplate(activeTemplate.body, variables),
    usedFallback: !stored || !stored.enabled,
  };
}

module.exports = {
  ensureDefaultTemplates,
  listTemplates,
  getTemplateByKey,
  updateTemplateByKey,
  renderTemplate,
  ensureKnownTemplateKey,
};
