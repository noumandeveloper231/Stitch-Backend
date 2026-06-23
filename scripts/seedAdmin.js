const mongoose = require("mongoose");
const dotenv = require("dotenv");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Role = require("../models/Role");
const { PERMISSION_MODULES } = require("../config/permissions");

dotenv.config();

const ADMIN_EMAIL = "admin@example.com";
const ADMIN_PASSWORD = "admin123";
const ADMIN_NAME = "Admin";

async function seedAdmin() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    let adminRole = await Role.findOne({ title: "admin" });
    if (!adminRole) {
      const adminPermissions = {};
      PERMISSION_MODULES.forEach((m) => {
        adminPermissions[m] = { show: true, create: true, delete: true, manage: true };
      });
      adminRole = await Role.create({
        title: "admin",
        permissions: adminPermissions,
      });
      console.log("Created admin role");
    }

    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);

    const existingUser = await User.findOne({ email: ADMIN_EMAIL });
    if (existingUser) {
      existingUser.password = hashedPassword;
      existingUser.role = adminRole._id;
      existingUser.name = ADMIN_NAME;
      await existingUser.save();
      console.log(`Updated existing admin user: ${ADMIN_EMAIL}`);
    } else {
      await User.create({
        name: ADMIN_NAME,
        email: ADMIN_EMAIL,
        password: hashedPassword,
        role: adminRole._id,
      });
      console.log(`Created admin user: ${ADMIN_EMAIL}`);
    }

    console.log("Admin seed completed successfully");
    process.exit(0);
  } catch (error) {
    console.error("Admin seed failed:", error);
    process.exit(1);
  }
}

seedAdmin();
