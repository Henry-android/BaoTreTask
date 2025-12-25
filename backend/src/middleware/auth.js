const jwt = require("jsonwebtoken");
const User = require("../models/User");

async function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || "dev_secret");

    // IMPORTANT: role/email in JWT can become stale (e.g., seed upgrades user to admin).
    // Use DB as the source of truth for authorization decisions.
    const user = await User.findById(payload.sub).select("email role");
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    req.user = {
      id: String(user._id),
      email: user.email,
      role: user.role,
    };
    return next();
  } catch (err) {
    // If jwt.verify fails, treat as unauthorized. For DB errors, bubble up to 500.
    if (err && (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError")) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    return next(err);
  }
}

function requireRole(role) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    if (req.user.role !== role)
      return res.status(403).json({ error: "Forbidden" });
    return next();
  };
}

module.exports = { requireAuth, requireRole };
