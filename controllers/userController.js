const asyncHandler = require("../middleware/asyncHandler");
const User = require("../models/User");
const Role = require("../models/Role");
const { sendTemplatedEmail } = require("../services/emailSenderService");
const { EMAIL_TEMPLATE_KEYS } = require("../services/emailTemplateDefaults");

exports.getUsers = asyncHandler(async (req, res) => {
  const users = await User.find().populate("role").lean();
  res.json({ data: users });
});

exports.createUser = asyncHandler(async (req, res) => {
  const { name, email, phone, roleId } = req.body;

  const existing = await User.findOne({ email });
  if (existing) {
    return res.status(400).json({ message: "Email already in use" });
  }

  // Generate temporary password
  const tempPassword = Math.random().toString(36).slice(-8);

  const user = await User.create({
    name,
    email,
    phone,
    role: roleId,
    tempPassword, // Shown to admin once
  });

  // Send email to user
  if (email) {
    try {
      const role = await Role.findById(roleId).lean();
      await sendTemplatedEmail({
        templateKey: EMAIL_TEMPLATE_KEYS.NEW_USER_AUTH_CREDENTIALS,
        to: email,
        variables: {
          user_name: name,
          user_email: email,
          login_url: `${process.env.FRONTEND_URL}/login`,
          temporary_password: tempPassword,
          account_role: role?.title || "user",
        },
      });
    } catch (err) {
      console.error("Failed to send welcome email:", err.message);
    }
  }

  res.status(201).json({ 
    data: user, 
    tempPassword // Return temp password to admin for one-time copy
  });
});

exports.updateUser = asyncHandler(async (req, res) => {
  const { name, email, phone, roleId, profilePicture } = req.body;
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { name, email, phone, role: roleId, profilePicture },
    { new: true }
  ).populate("role");

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }
  res.json({ data: user });
});

exports.deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }
  res.json({ data: { ok: true } });
});
