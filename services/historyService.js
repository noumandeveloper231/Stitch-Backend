const LoggedHistory = require("../models/LoggedHistory");
const axios = require("axios");
const UAParser = require("ua-parser-js");

function extractIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  const rawIp = Array.isArray(forwarded) ? forwarded[0] : forwarded || req.socket.remoteAddress || "0.0.0.0";
  const ip = String(rawIp).split(",")[0].trim().replace("::ffff:", "");
  return ip || "0.0.0.0";
}

function isPrivateOrLocalIp(ip) {
  const isPrivate172 = /^172\.(1[6-9]|2\d|3[0-1])\./.test(ip);
  return (
    ip === "127.0.0.1" ||
    ip === "::1" ||
    ip === "0.0.0.0" ||
    ip.startsWith("10.") ||
    ip.startsWith("192.168.") ||
    isPrivate172
  );
}

/**
 * Log login history for a user
 * @param {Object} user - The user object
 * @param {Object} req - The express request object
 */
async function logLogin(user, req) {
  try {
    const ip = extractIp(req);
    const userAgent = req.headers["user-agent"] || "";

    const parsed = new UAParser(userAgent).getResult();
    const os = parsed.os?.name || "Unknown OS";
    const browser = parsed.browser?.name || "Unknown Browser";
    const deviceType = parsed.device?.type || "desktop";
    const system = `${os} • ${browser} • ${deviceType}`;

    let city = "",
      state = "",
      country = "";

    if (!isPrivateOrLocalIp(ip)) {
      try {
        const token = process.env.IPINFO_TOKEN;
        const url = token
          ? `https://ipinfo.io/${ip}/json?token=${token}`
          : `https://ipinfo.io/${ip}/json`;
        const response = await axios.get(url, { timeout: 4000 });
        if (response.data) {
          city = response.data.city || "";
          state = response.data.region || "";
          country = response.data.country || "";
        }
      } catch (err) {
        console.error("Geo-location lookup failed:", err.message);
      }
    }

    await LoggedHistory.create({
      userId: user._id,
      email: user.email,
      ip,
      userAgent,
      system,
      city,
      state,
      country,
      loginDate: new Date(),
    });
  } catch (error) {
    console.error("Failed to log login history:", error.message);
    // Don't throw error to avoid blocking the login process
  }
}

async function getHistory(query = {}, sort = { loginDate: -1 }, limit = 100) {
  return LoggedHistory.find(query).sort(sort).populate("userId", "name email").limit(limit).lean();
}

async function deleteHistoryById(id) {
  return LoggedHistory.findByIdAndDelete(id);
}

module.exports = { logLogin, getHistory, deleteHistoryById };
