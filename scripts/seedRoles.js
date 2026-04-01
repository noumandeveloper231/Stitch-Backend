const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Role = require("../models/Role");
const User = require("../models/User");
const { PERMISSION_MODULES } = require("../config/permissions");

dotenv.config();

const MODULES = PERMISSION_MODULES;

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    // 1. Create Admin Role
    let adminRole = await Role.findOne({ title: "admin" });
    const adminPermissions = {};
    MODULES.forEach((m) => {
      adminPermissions[m] = { show: true, create: true, delete: true, manage: true };
    });

    if (!adminRole) {
      adminRole = await Role.create({
        title: "admin",
        permissions: adminPermissions,
      });
      console.log("Created admin role");
    } else {
      adminRole.permissions = adminPermissions;
      await adminRole.save();
      console.log("Updated admin role permissions");
    }

    // 2. Create Staff Role
    let staffRole = await Role.findOne({ title: "staff" });
    const staffPermissions = {};
    MODULES.forEach((m) => {
      // Staff has basic access but not user/role management
      const isSensitive = ["Users", "Roles"].includes(m);
      staffPermissions[m] = { 
        show: !isSensitive, 
        create: !isSensitive && m !== "Analytics", 
        delete: false, 
        manage: false 
      };
    });

    if (!staffRole) {
      staffRole = await Role.create({
        title: "staff",
        permissions: staffPermissions,
      });
      console.log("Created staff role");
    }

    // 3. Update existing users with string roles to ObjectId roles
    const users = await User.find({ role: { $type: "string" } });
    console.log(`Updating ${users.length} users with legacy role strings...`);

    for (const user of users) {
      const oldRole = user.role;
      if (oldRole === "admin") {
        user.role = adminRole._id;
      } else {
        user.role = staffRole._id;
      }
      // Ensure password is not erased if using replace/save
      await user.save();
      console.log(`Updated user ${user.email} to role ${oldRole}`);
    }

    console.log("Seeding completed successfully");
    process.exit(0);
  } catch (error) {
    console.error("Seeding failed:", error);
    process.exit(1);
  }
}

seed();
