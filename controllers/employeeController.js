const asyncHandler = require("../middleware/asyncHandler");
const Employee = require("../models/Employee");
const invitationService = require("../services/invitationService");

exports.getEmployees = asyncHandler(async (req, res) => {
  const employees = await Employee.find().sort({ createdAt: -1 }).lean();
  res.json({ data: employees });
});

exports.createEmployee = asyncHandler(async (req, res) => {
  const { firstName, lastName, email, phone } = req.body;

  const existing = await Employee.findOne({ email });
  if (existing) {
    return res.status(400).json({ message: "Email already in use" });
  }

  const employee = await Employee.create({
    firstName,
    lastName,
    email,
    phone: phone || "",
    status: "active",
    invitationStatus: "invited",
  });

  const { rawToken } = await invitationService.createInvitation({
    email,
    entityType: "employee",
    entityId: employee._id,
    createdBy: req.user.id,
    req,
  });

  try {
    await invitationService.sendInvitationEmail({
      rawToken,
      entityType: "employee",
      entityId: employee._id,
      email,
      name: `${firstName} ${lastName}`,
    });

    console.log(`Invitation email sent to ${email}`);
  } catch (err) {
    console.error("Failed to send invitation email:", err.message);
  }

  res.status(201).json({
    data: employee,
    message: "Employee created. Invitation email sent.",
  });
});

exports.updateEmployee = asyncHandler(async (req, res) => {
  const { firstName, lastName, email, phone, status } = req.body;
  const updateData = {};
  if (firstName !== undefined) updateData.firstName = firstName;
  if (lastName !== undefined) updateData.lastName = lastName;
  if (email !== undefined) updateData.email = email;
  if (phone !== undefined) updateData.phone = phone;
  if (status !== undefined) updateData.status = status;

  const employee = await Employee.findByIdAndUpdate(req.params.id, updateData, {
    returnDocument: "after",
  });

  if (!employee) {
    return res.status(404).json({ message: "Employee not found" });
  }
  res.json({ data: employee });
});

exports.deleteEmployee = asyncHandler(async (req, res) => {
  const employee = await Employee.findByIdAndDelete(req.params.id);
  if (!employee) {
    return res.status(404).json({ message: "Employee not found" });
  }
  res.json({ data: { ok: true } });
});
