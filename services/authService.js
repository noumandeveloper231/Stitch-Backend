const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const RefreshToken = require("../models/RefreshToken");

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

function signAccessToken(user) {
  return jwt.sign(
    { sub: user._id.toString(), role: user.role },
    accessSecret(),
    { expiresIn: accessExpiry() },
  );
}

function signRefreshToken(userId) {
  return jwt.sign({ sub: userId.toString(), type: "refresh" }, refreshSecret(), {
    expiresIn: process.env.REFRESH_TOKEN_EXPIRY || "7d",
  });
}

async function persistRefreshToken(userId, rawRefreshJwt) {
  const tokenHash = hashToken(rawRefreshJwt);
  const expiresAt = new Date(Date.now() + refreshExpiryMs());
  await RefreshToken.create({ userId, tokenHash, expiresAt });
}

async function issueTokens(user) {
  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user._id);
  await persistRefreshToken(user._id, refreshToken);
  return { accessToken, refreshToken };
}

async function register({ name, email, password, role }) {
  const existing = await User.findOne({ email });
  if (existing) {
    const err = new Error("Email already registered");
    err.statusCode = 409;
    throw err;
  }
  const hashed = await bcrypt.hash(password, 10);
  const isFirstUser = (await User.countDocuments()) === 0;
  const user = await User.create({
    name,
    email,
    password: hashed,
    role: isFirstUser ? "admin" : role === "admin" ? "staff" : role || "staff",
  });
  const tokens = await issueTokens(user);
  return {
    user: { id: user._id, name: user.name, email: user.email, role: user.role },
    ...tokens,
  };
}

async function login({ email, password }) {
  const user = await User.findOne({ email }).select("+password");
  if (!user) {
    const err = new Error("Invalid email or password");
    err.statusCode = 401;
    throw err;
  }
  const ok = await bcrypt.compare(password, user.password);
  if (!ok) {
    const err = new Error("Invalid email or password");
    err.statusCode = 401;
    throw err;
  }
  const tokens = await issueTokens(user);
  return {
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
    ...tokens,
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
  if (decoded.type !== "refresh") {
    const err = new Error("Invalid refresh token");
    err.statusCode = 401;
    throw err;
  }
  const tokenHash = hashToken(rawRefreshToken);
  const doc = await RefreshToken.findOne({ tokenHash, userId: decoded.sub });
  if (!doc || doc.expiresAt < new Date()) {
    const err = new Error("Invalid or expired refresh token");
    err.statusCode = 401;
    throw err;
  }
  await RefreshToken.deleteOne({ _id: doc._id });
  const user = await User.findById(decoded.sub);
  if (!user) {
    const err = new Error("User not found");
    err.statusCode = 401;
    throw err;
  }
  const newRefresh = signRefreshToken(user._id);
  await persistRefreshToken(user._id, newRefresh);
  const accessToken = signAccessToken(user);
  return { accessToken, refreshToken: newRefresh };
}

async function logout(rawRefreshToken) {
  if (!rawRefreshToken) return;
  const tokenHash = hashToken(rawRefreshToken);
  await RefreshToken.deleteOne({ tokenHash });
}

async function getMe(userId) {
  const user = await User.findById(userId);
  if (!user) {
    const err = new Error("User not found");
    err.statusCode = 404;
    throw err;
  }
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
}

module.exports = {
  register,
  login,
  refresh,
  logout,
  getMe,
  signAccessToken,
  hashToken,
};
