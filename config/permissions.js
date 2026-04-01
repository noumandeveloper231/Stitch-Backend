const PERMISSION_MODULES = [
  "Customers",
  "Measurements",
  "Orders",
  "Order Kanban",
  "Dashboard",
  "Analytics",
  "Users",
  "Roles",
  "Email Templates",
];

const PERMISSION_ACTIONS = ["show", "create", "delete", "manage"];

function emptyPermissionSet() {
  return { show: false, create: false, delete: false, manage: false };
}

module.exports = {
  PERMISSION_MODULES,
  PERMISSION_ACTIONS,
  emptyPermissionSet,
};
