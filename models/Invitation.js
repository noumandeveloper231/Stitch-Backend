const mongoose = require("mongoose");

const invitationSchema = new mongoose.Schema(
  {
    tokenHash: { type: String, required: true, unique: true, index: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    entityType: {
      type: String,
      required: true,
      enum: ["user", "employee"],
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: "entityType",
    },
    expiresAt: { type: Date, required: true },
    isUsed: { type: Boolean, default: false },
    acceptedAt: { type: Date, default: null },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    eventLogs: [
      {
        event: {
          type: String,
          enum: ["created", "sent", "resent", "accepted", "expired", "revoked"],
          required: true,
        },
        timestamp: { type: Date, default: Date.now },
        ip: { type: String, default: "" },
        userAgent: { type: String, default: "" },
      },
    ],
  },
  { timestamps: true },
);

invitationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("Invitation", invitationSchema);
