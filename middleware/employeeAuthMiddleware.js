const jwt = require("jsonwebtoken");

function extractBearer(req) {
  const h = req.headers.authorization;
  if (!h) return null;
  if (h.startsWith("Bearer ")) return h.slice(7);
  return h;
}

function requireEmployeeAuth(req, res, next) {
  const token = extractBearer(req);
  if (!token) {
    return res.status(401).json({ message: "Authentication required" });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.type !== "employee") {
      return res.status(403).json({ message: "Invalid token type" });
    }
    req.employee = { id: decoded.sub };
    next();
  } catch {
    res.status(401).json({ message: "Invalid or expired token" });
  }
}

module.exports = { requireEmployeeAuth, extractBearer };
