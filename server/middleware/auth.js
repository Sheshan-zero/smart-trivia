const jwt = require("jsonwebtoken");

function authRequired(req, res, next) {
  try {
    const hdr = req.headers.authorization || "";
    const token = hdr.startsWith("Bearer ") ? hdr.slice(7) : null;
    if (!token) return res.status(401).json({ error: "Missing access token" });

    const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    req.user = { uid: payload.uid, role: payload.role, email: payload.email };
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

function isAdmin(req, res, next) {
  if (req.user?.role === "admin") return next();
  return res.status(403).json({ error: "Admin only" });
}

module.exports = { authRequired, isAdmin };
