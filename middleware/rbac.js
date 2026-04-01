const mongoose = require("mongoose");
const Role = require("../models/Role");
const { PERMISSION_MODULES, PERMISSION_ACTIONS } = require("../config/permissions");

/**
 * RBAC Middleware
 * @param {string} module - The module name (e.g., 'Order', 'Customer')
 * @param {string} action - The action name (e.g., 'create', 'delete', 'manage', 'show')
 */
const checkPermission = (module, action) => {
  if (!PERMISSION_MODULES.includes(module)) {
    throw new Error(`Unknown RBAC module: ${module}`);
  }
  if (!PERMISSION_ACTIONS.includes(action)) {
    throw new Error(`Unknown RBAC action: ${action}`);
  }

  return async (req, res, next) => {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      let role = user.role;

      // Handle cases where role is still a string or ObjectId (e.g. from JWT or not populated)
      if (typeof role === "string" || role instanceof mongoose.Types.ObjectId) {
        // Handle legacy role strings
        if (role === "admin" || role === "staff") {
          role = await Role.findOne({ title: role });
        } else if (mongoose.Types.ObjectId.isValid(role)) {
          role = await Role.findById(role);
        } else {
          // Some other string that is not a valid ObjectId or "admin"/"staff"
          return res.status(403).json({ message: "Invalid role reference" });
        }
        
        if (!role) {
          return res.status(403).json({ message: "User role not found in database" });
        }
        
        // Update req.user.role with the populated object for the rest of the request
        user.role = role;
      }

      // If user.role is already an object, but not a Mongoose document/map
      if (String(user.role?.title || "").toLowerCase() === "admin") {
        return next();
      }

      const permissions = user.role.permissions;
      if (!permissions) {
        return res.status(403).json({ message: "No permissions defined for this role" });
      }

      // Mongoose Maps use .get(), plain objects use []
      const modulePerms = (permissions instanceof Map) 
        ? permissions.get(module) 
        : permissions[module];

      if (!modulePerms) {
        return res.status(403).json({ message: "Access denied: Module not permitted" });
      }

      // 'manage' gives full access to all actions in that module
      if (modulePerms.manage || modulePerms[action]) {
        return next();
      }

      return res.status(403).json({ message: "Access denied" });
    } catch (error) {
      console.error("RBAC Middleware Error:", error);
      next(error);
    }
  };
};

module.exports = { checkPermission };
