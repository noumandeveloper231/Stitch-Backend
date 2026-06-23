const asyncHandler = require("../middleware/asyncHandler");
const employeeAuthService = require("../services/employeeAuthService");
const orderAssignmentService = require("../services/orderAssignmentService");

exports.login = asyncHandler(async (req, res) => {
  const result = await employeeAuthService.login(req.body, req);
  res.json({ data: result });
});

exports.changePassword = asyncHandler(async (req, res) => {
  const result = await employeeAuthService.changePassword(req.employee.id, req.body);
  res.json({ data: result });
});

exports.refresh = asyncHandler(async (req, res) => {
  const result = await employeeAuthService.refresh(req.body.refreshToken);
  res.json({ data: result });
});

exports.logout = asyncHandler(async (req, res) => {
  await employeeAuthService.logout(req.body.refreshToken);
  res.json({ data: { ok: true } });
});

exports.me = asyncHandler(async (req, res) => {
  const employee = await employeeAuthService.getMe(req.employee.id);
  res.json({ data: employee });
});

exports.myTasks = asyncHandler(async (req, res) => {
  const tasks = await orderAssignmentService.getEmployeeTasks(req.employee.id);
  res.json({ data: tasks });
});
