const asyncHandler = require("../middleware/asyncHandler");
const Role = require("../models/Role");
const {
  normalizePermissions,
  buildDefaultPermissionsForRole,
} = require("../services/rolePermissionService");

exports.getRoles = asyncHandler(async (req, res) => {
  const roles = await Role.find().lean();
  res.json({ data: roles });
});

exports.createRole = asyncHandler(async (req, res) => {
  const payload = { ...req.body };
  payload.permissions = payload.permissions
    ? normalizePermissions(payload.permissions, payload.title)
    : buildDefaultPermissionsForRole(payload.title);
  const role = await Role.create(payload);
  res.status(201).json({ data: role });
});

exports.updateRole = asyncHandler(async (req, res) => {
  const patch = { ...req.body };
  if (patch.permissions) {
    const currentRole = await Role.findById(req.params.id).lean();
    if (!currentRole) {
      return res.status(404).json({ message: "Role not found" });
    }
    patch.permissions = normalizePermissions(
      patch.permissions,
      patch.title || currentRole.title,
    );
  }
  const role = await Role.findByIdAndUpdate(req.params.id, patch, { new: true });
  if (!role) {
    return res.status(404).json({ message: "Role not found" });
  }
  res.json({ data: role });
});

exports.deleteRole = asyncHandler(async (req, res) => {
  // Check if role is in use
  const User = require("../models/User");
  const inUse = await User.exists({ role: req.params.id });
  if (inUse) {
    return res.status(400).json({ message: "Role is in use and cannot be deleted" });
  }

  const role = await Role.findByIdAndDelete(req.params.id);
  if (!role) {
    return res.status(404).json({ message: "Role not found" });
  }
  res.json({ data: { ok: true } });
});
