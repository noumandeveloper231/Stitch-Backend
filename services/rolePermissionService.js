const Role = require("../models/Role");
const { PERMISSION_MODULES, emptyPermissionSet } = require("../config/permissions");

function normalizePermissions(inputPermissions, roleTitle = "") {
  const source =
    inputPermissions instanceof Map ? Object.fromEntries(inputPermissions.entries()) : inputPermissions || {};
  const normalized = {};

  for (const moduleName of PERMISSION_MODULES) {
    const existing = source[moduleName] || {};
    const isAdmin = String(roleTitle || "").toLowerCase() === "admin";
    normalized[moduleName] = {
      show: isAdmin ? true : Boolean(existing.show),
      create: isAdmin ? true : Boolean(existing.create),
      delete: isAdmin ? true : Boolean(existing.delete),
      manage: isAdmin ? true : Boolean(existing.manage),
    };
  }

  return normalized;
}

async function ensureSystemRolePermissions() {
  const roles = await Role.find({});
  for (const role of roles) {
    const normalized = normalizePermissions(role.permissions, role.title);
    role.permissions = normalized;
    await role.save();
  }
}

function buildDefaultPermissionsForRole(title = "") {
  const perms = {};
  const isAdmin = String(title).toLowerCase() === "admin";
  for (const moduleName of PERMISSION_MODULES) {
    perms[moduleName] = isAdmin
      ? { show: true, create: true, delete: true, manage: true }
      : emptyPermissionSet();
  }
  return perms;
}

module.exports = {
  normalizePermissions,
  ensureSystemRolePermissions,
  buildDefaultPermissionsForRole,
};
