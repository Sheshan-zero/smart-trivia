module.exports.adminRequired = (req, res, next) => {
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({ error: "Admin only" });
  }
  next();
};
