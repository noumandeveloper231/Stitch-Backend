const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");

dotenv.config();

const connectDB = require("./config/db");
const errorHandler = require("./middleware/errorHandler");

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

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/customers", require("./routes/customerRoutes"));
app.use("/api/orders", require("./routes/orderRoutes"));
app.use("/api/measurements", require("./routes/measurementRoutes"));
app.use("/api/analytics", require("./routes/analyticsRoutes"));
app.use("/api/notifications", require("./routes/notificationRoutes"));
app.use("/api/search", require("./routes/searchRoutes"));
app.use("/api/cron", require("./routes/cronRoutes"));

app.get("/", (req, res) => {
  res.send("Stitch API running");
});

app.use(errorHandler);

module.exports = app;
