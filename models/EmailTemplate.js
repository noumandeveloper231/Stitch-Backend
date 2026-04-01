const mongoose = require("mongoose");

const emailTemplateSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, trim: true },
    templateName: { type: String, required: true, trim: true, maxlength: 200 },
    templateType: { type: String, required: true, trim: true, maxlength: 120 },
    placeholders: [{ type: String, trim: true }],
    enabled: { type: Boolean, default: true },
    subject: { type: String, required: true, trim: true, maxlength: 500 },
    body: { type: String, required: true },
    version: { type: Number, default: 1, min: 1 },
  },
  { timestamps: true },
);

emailTemplateSchema.index({ key: 1 }, { unique: true });

module.exports = mongoose.model("EmailTemplate", emailTemplateSchema);
