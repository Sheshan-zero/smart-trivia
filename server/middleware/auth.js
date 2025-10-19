const jwt = require("jsonwebtoken");
const User = require("../models/User");

function authRequired(req, res, next) {
  try {
    const hdr = req.headers.authorization || "";
    const [, token] = hdr.split(" ");
    if (!token) return res.status(401).json({ error: "Auth required" });

    const p = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    req.user = {
      uid: p.uid || p.id || p._id,
      email: p.email,
      // token may contain either isAdmin or role
      isAdmin: p.isAdmin,
      role: p.role,
    };
    if (!req.user.uid) return res.status(401).json({ error: "Invalid token" });
    next();
  } catch (e) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

async function isAdmin(req, res, next) {
  try {
    if (!req.user) return res.status(401).json({ error: "Auth required" });

    // Trust token if it *explicitly* indicates admin
    if (req.user.isAdmin === true || req.user.role === "admin") {
      return next();
    }

    // Otherwise, check DB (covers tokens that lack admin claims)
    const u = await User.findById(req.user.uid).select("role");
    if (!u || u.role !== "admin") {
      return res.status(403).json({ error: "Admin only" });
    }

    // cache for downstream
    req.user.isAdmin = true;
    req.user.role = "admin";
    next();
  } catch (e) {
    next(e);
  }
}

module.exports = { authRequired, isAdmin };
