const asyncHandler = require("../middleware/asyncHandler");
const User = require("../models/User");
const invitationService = require("../services/invitationService");

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

  const user = await User.create({
    name,
    email,
    phone,
    role: roleId,
    invitationStatus: "invited",
  });

  const { rawToken } = await invitationService.createInvitation({
    email,
    entityType: "user",
    entityId: user._id,
    createdBy: req.user.id,
    req,
  });

  if (email) {
    try {
      const role = await require("mongoose").model("Role").findById(roleId).lean();
      await invitationService.sendInvitationEmail({
        rawToken,
        entityType: "user",
        entityId: user._id,
        email,
        name,
      });
    } catch (err) {
      console.error("Failed to send invitation email:", err.message);
    }
  }

  res.status(201).json({
    data: user,
    message: "User created. Invitation email sent.",
  });
});

exports.updateUser = asyncHandler(async (req, res) => {
  const { name, email, phone, roleId, profilePicture } = req.body;
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { name, email, phone, role: roleId, profilePicture },
    { returnDocument: "after" },
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
