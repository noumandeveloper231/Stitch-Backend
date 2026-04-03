const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");

dotenv.config();

const connectDB = require("./config/db");
const errorHandler = require("./middleware/errorHandler");
const { ensureDefaultTemplates } = require("./services/emailTemplateService");
const { ensureSystemRolePermissions } = require("./services/rolePermissionService");

const app = express();

const allowedOrigins = process.env.ALLOWED_ORIGINS.split(",")

app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json());

const dbReady = connectDB();
app.use(async (req, res, next) => {
  try {
    await dbReady;
    next();
  } catch (err) {
    next(err);
  }
});

dbReady
  .then(async () => {
    await ensureDefaultTemplates();
    await ensureSystemRolePermissions();
  })
  .catch((err) => console.error("Startup permission/template sync failed:", err?.message || err));

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/roles", require("./routes/roleRoutes"));
app.use("/api/history", require("./routes/historyRoutes"));
app.use("/api/customers", require("./routes/customerRoutes"));
app.use("/api/customer-notes", require("./routes/customerNoteRoutes"));
app.use("/api/orders", require("./routes/orderRoutes"));
app.use("/api/measurements", require("./routes/measurementRoutes"));
app.use("/api/expenses", require("./routes/expenseRoutes"));
app.use("/api/expense-categories", require("./routes/expenseCategoryRoutes"));
app.use("/api/expense-subcategories", require("./routes/expenseSubcategoryRoutes"));
app.use("/api/stitching-types", require("./routes/stitchingRoutes"));
app.use("/api/analytics", require("./routes/analyticsRoutes"));
app.use("/api/email-templates", require("./routes/emailTemplateRoutes"));
app.use("/api/notifications", require("./routes/notificationRoutes"));
app.use("/api/search", require("./routes/searchRoutes"));
app.use("/api/cron", require("./routes/cronRoutes"));

app.get("/", (req, res) => {
  res.send("Stitch API running");
});

app.use(errorHandler);

module.exports = app;
