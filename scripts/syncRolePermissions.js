const mongoose = require("mongoose");
const dotenv = require("dotenv");
const { ensureSystemRolePermissions } = require("../services/rolePermissionService");

dotenv.config();

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    await ensureSystemRolePermissions();
    console.log("Role permissions synced successfully.");
    process.exit(0);
  } catch (error) {
    console.error("Failed to sync role permissions:", error);
    process.exit(1);
  }
}

run();
