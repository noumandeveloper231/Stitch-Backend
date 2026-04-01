const mongoose = require("mongoose");
const dotenv = require("dotenv");
const User = require("../models/User");
const Role = require("../models/Role");

dotenv.config();

/**
 * Script to promote a user to Admin role
 * Usage: node scripts/makeAdmin.js your-email@example.com
 */
async function makeAdmin() {
  const email = process.argv[2];
  if (!email) {
    console.error("Please provide an email address: node scripts/makeAdmin.js <email>");
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    const adminRole = await Role.findOne({ title: "admin" });
    if (!adminRole) {
      console.error("Admin role not found. Run 'node scripts/seedRoles.js' first.");
      process.exit(1);
    }

    const user = await User.findOne({ email });
    if (!user) {
      console.error(`User with email '${email}' not found.`);
      process.exit(1);
    }

    user.role = adminRole._id;
    user.tempPassword = ""; // Ensure they can log in normally
    await user.save();

    console.log(`Successfully promoted ${email} to Admin.`);
    process.exit(0);
  } catch (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }
}

makeAdmin();
