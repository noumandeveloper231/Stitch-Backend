const asyncHandler = require("../middleware/asyncHandler");
const authService = require("../services/authService");

exports.register = asyncHandler(async (req, res) => {
  const result = await authService.register(req.body);
  res.status(201).json({ data: result });
});

exports.login = asyncHandler(async (req, res) => {
  const result = await authService.login(req.body);
  res.json({ data: result });
});

exports.refresh = asyncHandler(async (req, res) => {
  const result = await authService.refresh(req.body.refreshToken);
  res.json({ data: result });
});

exports.logout = asyncHandler(async (req, res) => {
  await authService.logout(req.body.refreshToken);
  res.json({ data: { ok: true } });
});

exports.me = asyncHandler(async (req, res) => {
  const user = await authService.getMe(req.user.id);
  res.json({ data: user });
});
