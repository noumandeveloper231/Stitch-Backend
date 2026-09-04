const crypto = require("crypto");
const Invitation = require("../models/Invitation");
const User = require("../models/User");
const Employee = require("../models/Employee");
const { sendTemplatedEmail } = require("./emailSenderService");
const { EMAIL_TEMPLATE_KEYS } = require("./emailTemplateDefaults");

const INVITATION_EXPIRY_HOURS = parseInt(process.env.INVITATION_EXPIRY_HOURS || "48", 10);

function hashToken(raw) {
  return crypto.createHash("sha256").update(raw).digest("hex");
}

function generateRawToken() {
  return crypto.randomBytes(32).toString("hex");
}

async function createInvitation({ email, entityType, entityId, createdBy, req }) {
  const rawToken = generateRawToken();
  const tokenHash = hashToken(rawToken);

  const invitation = await Invitation.create({
    tokenHash,
    email,
    entityType,
    entityId,
    expiresAt: new Date(Date.now() + INVITATION_EXPIRY_HOURS * 60 * 60 * 1000),
    createdBy,
    eventLogs: [
      {
        event: "created",
        timestamp: new Date(),
        ip: req?.ip || "",
        userAgent: req?.headers?.["user-agent"] || "",
      },
    ],
  });

  return { invitation, rawToken };
}

async function sendInvitationEmail({ rawToken, entityType, entityId, email, name }) {
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
  const acceptUrl = `${frontendUrl}/accept-invitation?token=${rawToken}`;

  const templateKey =
    entityType === "employee"
      ? EMAIL_TEMPLATE_KEYS.EMPLOYEE_INVITATION
      : EMAIL_TEMPLATE_KEYS.USER_INVITATION;

  const variables =
    entityType === "employee"
      ? {
          employee_name: name,
          invitation_url: acceptUrl,
          invitation_token: rawToken,
          expiry_hours: String(INVITATION_EXPIRY_HOURS),
        }
      : {
          user_name: name,
          invitation_url: acceptUrl,
          invitation_token: rawToken,
          account_role: "",
          expiry_hours: String(INVITATION_EXPIRY_HOURS),
        };

  return sendTemplatedEmail({
    templateKey,
    to: email,
    variables,
  });
}

async function validateInvitation(rawToken) {
  const tokenHash = hashToken(rawToken);
  const invitation = await Invitation.findOne({ tokenHash });

  if (!invitation) {
    const err = new Error("Invitation not found");
    err.statusCode = 404;
    throw err;
  }

  if (invitation.isUsed) {
    const err = new Error("This invitation has already been used");
    err.statusCode = 400;
    throw err;
  }

  if (invitation.expiresAt < new Date()) {
    const err = new Error("This invitation has expired");
    err.statusCode = 400;
    throw err;
  }

  let entity = null;
  if (invitation.entityType === "user") {
    entity = await User.findById(invitation.entityId).lean();
  } else {
    entity = await Employee.findById(invitation.entityId).lean();
  }

  if (!entity) {
    const err = new Error("Associated account not found");
    err.statusCode = 404;
    throw err;
  }

  return { invitation, entity };
}

async function completeInvitation(rawToken, password) {
  const tokenHash = hashToken(rawToken);
  const invitation = await Invitation.findOne({ tokenHash });

  if (!invitation) {
    const err = new Error("Invitation not found");
    err.statusCode = 404;
    throw err;
  }

  if (invitation.isUsed) {
    const err = new Error("This invitation has already been used");
    err.statusCode = 400;
    throw err;
  }

  if (invitation.expiresAt < new Date()) {
    const err = new Error("This invitation has expired");
    err.statusCode = 400;
    throw err;
  }

  const bcrypt = require("bcryptjs");
  const hashedPassword = await bcrypt.hash(password, 10);

  let entity = null;
  if (invitation.entityType === "user") {
    entity = await User.findByIdAndUpdate(
      invitation.entityId,
      { password: hashedPassword, invitationStatus: "active" },
      { returnDocument: "after" },
    ).populate("role");
  } else {
    entity = await Employee.findByIdAndUpdate(
      invitation.entityId,
      { password: hashedPassword, invitationStatus: "active" },
      { returnDocument: "after" },
    );
  }

  if (!entity) {
    const err = new Error("Associated account not found");
    err.statusCode = 404;
    throw err;
  }

  invitation.isUsed = true;
  invitation.acceptedAt = new Date();
  invitation.eventLogs.push({
    event: "accepted",
    timestamp: new Date(),
  });
  await invitation.save();

  return { entity, entityType: invitation.entityType };
}

async function resendInvitation(invitationId, req) {
  const existing = await Invitation.findById(invitationId);
  if (!existing) {
    const err = new Error("Invitation not found");
    err.statusCode = 404;
    throw err;
  }

  if (existing.isUsed) {
    const err = new Error("Cannot resend a used invitation");
    err.statusCode = 400;
    throw err;
  }

  const rawToken = generateRawToken();
  const tokenHash = hashToken(rawToken);

  existing.tokenHash = tokenHash;
  existing.expiresAt = new Date(Date.now() + INVITATION_EXPIRY_HOURS * 60 * 60 * 1000);
  existing.eventLogs.push({
    event: "resent",
    timestamp: new Date(),
    ip: req?.ip || "",
    userAgent: req?.headers?.["user-agent"] || "",
  });
  await existing.save();

  let name = "";
  if (existing.entityType === "user") {
    const user = await User.findById(existing.entityId).lean();
    name = user?.name || "";
  } else {
    const employee = await Employee.findById(existing.entityId).lean();
    name = employee ? `${employee.firstName} ${employee.lastName}` : "";
  }

  return { invitation: existing, rawToken, name };
}

async function sendResendEmail({ rawToken, invitation, name }) {
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
  const acceptUrl = `${frontendUrl}/accept-invitation?token=${rawToken}`;

  const templateKey =
    invitation.entityType === "employee"
      ? EMAIL_TEMPLATE_KEYS.EMPLOYEE_INVITATION
      : EMAIL_TEMPLATE_KEYS.USER_INVITATION;

  const variables =
    invitation.entityType === "employee"
      ? {
          employee_name: name,
          invitation_url: acceptUrl,
          invitation_token: rawToken,
          expiry_hours: String(INVITATION_EXPIRY_HOURS),
        }
      : {
          user_name: name,
          invitation_url: acceptUrl,
          invitation_token: rawToken,
          account_role: "",
          expiry_hours: String(INVITATION_EXPIRY_HOURS),
        };

  return sendTemplatedEmail({
    templateKey,
    to: invitation.email,
    variables,
  });
}

async function revokeInvitation(invitationId, req) {
  const invitation = await Invitation.findById(invitationId);
  if (!invitation) {
    const err = new Error("Invitation not found");
    err.statusCode = 404;
    throw err;
  }

  if (invitation.isUsed) {
    const err = new Error("Cannot revoke a used invitation");
    err.statusCode = 400;
    throw err;
  }

  invitation.isUsed = true;
  invitation.eventLogs.push({
    event: "revoked",
    timestamp: new Date(),
    ip: req?.ip || "",
    userAgent: req?.headers?.["user-agent"] || "",
  });
  await invitation.save();

  return invitation;
}

module.exports = {
  createInvitation,
  sendInvitationEmail,
  validateInvitation,
  completeInvitation,
  resendInvitation,
  sendResendEmail,
  revokeInvitation,
  hashToken,
  generateRawToken,
};
