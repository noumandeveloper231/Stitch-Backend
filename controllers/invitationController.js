const asyncHandler = require("../middleware/asyncHandler");
const invitationService = require("../services/invitationService");
const jwt = require("jsonwebtoken");

function accessSecret() {
  const s = process.env.JWT_SECRET;
  if (!s) throw new Error("JWT_SECRET is not set");
  return s;
}

function accessExpiry() {
  return process.env.ACCESS_TOKEN_EXPIRY || "15m";
}

const authService = require("../services/authService");
const employeeAuthService = require("../services/employeeAuthService");

exports.validate = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { invitation, entity } = await invitationService.validateInvitation(token);

  const name =
    invitation.entityType === "user"
      ? entity.name
      : `${entity.firstName} ${entity.lastName}`;

  res.json({
    data: {
      valid: true,
      name,
      email: invitation.email,
      entityType: invitation.entityType,
    },
  });
});

exports.complete = asyncHandler(async (req, res) => {
  const { token, password } = req.body;

  if (!token || !password) {
    return res.status(400).json({ message: "Token and password are required" });
  }

  if (password.length < 6) {
    return res.status(400).json({ message: "Password must be at least 6 characters" });
  }

  const { entity, entityType } = await invitationService.completeInvitation(token, password);

  let tokens;
  let userData;

  if (entityType === "user") {
    tokens = await authService.issueTokens(entity);
    userData = {
      id: entity._id,
      name: entity.name,
      email: entity.email,
      role: entity.role,
      entityType: "user",
    };
  } else {
    tokens = await employeeAuthService.issueTokens(entity);
    userData = {
      id: entity._id,
      firstName: entity.firstName,
      lastName: entity.lastName,
      email: entity.email,
      role: "employee",
      entityType: "employee",
    };
  }

  res.json({
    data: {
      ...tokens,
      user: userData,
      entityType,
    },
  });
});

exports.resend = asyncHandler(async (req, res) => {
  const { invitationId } = req.body;

  if (!invitationId) {
    return res.status(400).json({ message: "invitationId is required" });
  }

  const { invitation, rawToken, name } = await invitationService.resendInvitation(
    invitationId,
    req,
  );

  await invitationService.sendResendEmail({ rawToken, invitation, name });

  res.json({ data: { message: "Invitation resent successfully" } });
});

exports.revoke = asyncHandler(async (req, res) => {
  const { invitationId } = req.body;

  if (!invitationId) {
    return res.status(400).json({ message: "invitationId is required" });
  }

  await invitationService.revokeInvitation(invitationId, req);

  res.json({ data: { message: "Invitation revoked successfully" } });
});
