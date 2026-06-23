const mongoose = require("mongoose");
const dotenv = require("dotenv");
const User = require("../models/User");

dotenv.config();

async function migrate() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    // 1. Remove tempPassword field from all users
    //    Set invitationStatus based on whether password exists
    const users = await User.find({}).select("+password +tempPassword");
    console.log(`Found ${users.length} users to process`);

    let updated = 0;
    for (const user of users) {
      const updateData = {};

      if (user.password) {
        updateData.invitationStatus = "active";
      } else {
        updateData.invitationStatus = "invited";
      }

      await User.findByIdAndUpdate(user._id, {
        $set: updateData,
        $unset: { tempPassword: "" },
      });
      updated++;
    }

    console.log(`Updated ${updated} users: removed tempPassword, set invitationStatus`);
    console.log("Migration completed successfully");
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

migrate();
