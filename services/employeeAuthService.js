const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const Employee = require("../models/Employee");
const RefreshToken = require("../models/RefreshToken");
const { logLogin } = require("./historyService");

function hashToken(raw) {
  return crypto.createHash("sha256").update(raw).digest("hex");
}

function accessSecret() {
  const s = process.env.JWT_SECRET;
  if (!s) throw new Error("JWT_SECRET is not set");
  return s;
}

function refreshSecret() {
  const s = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;
  if (!s) throw new Error("JWT_REFRESH_SECRET or JWT_SECRET is not set");
  return s;
}

function accessExpiry() {
  return process.env.ACCESS_TOKEN_EXPIRY || "15m";
}

function refreshExpiryMs() {
  const days = parseInt(process.env.REFRESH_TOKEN_DAYS || "7", 10);
  return days * 24 * 60 * 60 * 1000;
}

function signAccessToken(employee) {
  return jwt.sign(
    { sub: employee._id.toString(), type: "employee", role: "employee" },
    accessSecret(),
    { expiresIn: accessExpiry() },
  );
}

function signRefreshToken(employeeId) {
  return jwt.sign(
    { sub: employeeId.toString(), type: "employee", tokenType: "refresh" },
    refreshSecret(),
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRY || "7d" },
  );
}

async function persistRefreshToken(employeeId, rawRefreshJwt) {
  const tokenHash = hashToken(rawRefreshJwt);
  const expiresAt = new Date(Date.now() + refreshExpiryMs());
  await RefreshToken.create({
    tokenHash,
    entityType: "employee",
    employeeId,
    expiresAt,
  });
}

async function issueTokens(employee) {
  const accessToken = signAccessToken(employee);
  const refreshToken = signRefreshToken(employee._id);
  await persistRefreshToken(employee._id, refreshToken);
  return { accessToken, refreshToken };
}

async function login({ email, password }, req) {
  const employee = await Employee.findOne({ email }).select("+password");
  if (!employee) {
    const err = new Error("Invalid email or password");
    err.statusCode = 401;
    throw err;
  }

  if (employee.status === "inactive" || employee.status === "disabled") {
    const err = new Error("Account is not active");
    err.statusCode = 403;
    throw err;
  }

  if (!employee.password) {
    const err = new Error("Account has not been activated yet");
    err.statusCode = 403;
    throw err;
  }

  const ok = await bcrypt.compare(password, employee.password);
  if (!ok) {
    const err = new Error("Invalid email or password");
    err.statusCode = 401;
    throw err;
  }

  await Employee.findByIdAndUpdate(employee._id, { lastLoginAt: new Date() });

  if (req) {
    await logLogin(
      { _id: employee._id, email: employee.email, entityType: "employee" },
      req,
    );
  }

  const tokens = await issueTokens(employee);
  return {
    user: {
      id: employee._id,
      firstName: employee.firstName,
      lastName: employee.lastName,
      email: employee.email,
      role: "employee",
      entityType: "employee",
    },
    ...tokens,
  };
}

async function changePassword(employeeId, { newPassword }) {
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  const employee = await Employee.findByIdAndUpdate(
    employeeId,
    { password: hashedPassword },
    { returnDocument: "after" },
  );

  if (!employee) {
    const err = new Error("Employee not found");
    err.statusCode = 404;
    throw err;
  }

  return {
    id: employee._id,
    firstName: employee.firstName,
    lastName: employee.lastName,
    email: employee.email,
  };
}

async function refresh(rawRefreshToken) {
  let decoded;
  try {
    decoded = jwt.verify(rawRefreshToken, refreshSecret());
  } catch {
    const err = new Error("Invalid or expired refresh token");
    err.statusCode = 401;
    throw err;
  }

  if (decoded.tokenType !== "refresh" || decoded.type !== "employee") {
    const err = new Error("Invalid refresh token");
    err.statusCode = 401;
    throw err;
  }

  const tokenHash = hashToken(rawRefreshToken);
  const doc = await RefreshToken.findOne({
    tokenHash,
    employeeId: decoded.sub,
    entityType: "employee",
  });

  if (!doc || doc.expiresAt < new Date()) {
    const err = new Error("Invalid or expired refresh token");
    err.statusCode = 401;
    throw err;
  }

  await RefreshToken.deleteOne({ _id: doc._id });

  const employee = await Employee.findById(decoded.sub);
  if (!employee) {
    const err = new Error("Employee not found");
    err.statusCode = 401;
    throw err;
  }

  const newRefresh = signRefreshToken(employee._id);
  await persistRefreshToken(employee._id, newRefresh);
  const accessToken = signAccessToken(employee);
  return { accessToken, refreshToken: newRefresh };
}

async function logout(rawRefreshToken) {
  if (!rawRefreshToken) return;
  const tokenHash = hashToken(rawRefreshToken);
  await RefreshToken.deleteOne({ tokenHash, entityType: "employee" });
}

async function getMe(employeeId) {
  const employee = await Employee.findById(employeeId);
  if (!employee) {
    const err = new Error("Employee not found");
    err.statusCode = 404;
    throw err;
  }

  return {
    id: employee._id,
    firstName: employee.firstName,
    lastName: employee.lastName,
    email: employee.email,
    phone: employee.phone,
    profilePicture: employee.profilePicture,
    status: employee.status,
    invitationStatus: employee.invitationStatus,
    employeeRole: employee.employeeRole,
    role: "employee",
    entityType: "employee",
  };
}

module.exports = {
  issueTokens,
  login,
  changePassword,
  refresh,
  logout,
  getMe,
  signAccessToken,
  hashToken,
};
