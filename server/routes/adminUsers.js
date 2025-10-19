const express = require("express");
const mongoose = require("mongoose");
const { authRequired, isAdmin } = require("../middleware/auth"); // use robust admin check
const User = require("../models/User");
const Otp = require("../models/Otp");
const { sendMail } = require("../utils/mailer");

const router = express.Router();

router.use(authRequired, isAdmin);

router.get("/", async (req, res) => {
  const {
    query = "",
    role = "all",
    status = "all",
    page = "1",
    limit = "20",
  } = req.query;

  const q = {};

  if (query) {
    const rx = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    q.$or = [{ email: rx }, { name: rx }];
  }

  if (role === "admin") {
    q.isAdmin = true;
  } else if (role === "student") {
    q.$and = (q.$and || []).concat([
      { $or: [{ isAdmin: { $exists: false } }, { isAdmin: false }] },
    ]);
  }

  if (status === "active") {
    q.$and = (q.$and || []).concat([
      { $or: [{ isSuspended: { $exists: false } }, { isSuspended: false }] },
    ]);
  } else if (status === "suspended") {
    q.isSuspended = true;
  }

  const per = Math.min(parseInt(limit, 10) || 20, 100);
  const p = Math.max(1, parseInt(page, 10) || 1);
  const skip = (p - 1) * per;

  const [items, total] = await Promise.all([
    User.find(q)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(per)
      .select("_id name email isAdmin isSuspended createdAt lastLoginAt")
      .lean(),
    User.countDocuments(q),
  ]);

  res.json({ ok: true, items, total, page: p, limit: per });
});

router.patch("/:id", async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id))
    return res.status(400).json({ error: "Invalid user id" });

  const { name, isAdmin: makeAdmin, isSuspended } = req.body || {};
  const updates = {};
  if (typeof name === "string") updates.name = name;
  if (typeof makeAdmin === "boolean") updates.isAdmin = makeAdmin;
  if (typeof isSuspended === "boolean") updates.isSuspended = isSuspended;

  const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true })
    .select("_id name email isAdmin isSuspended createdAt lastLoginAt");
  if (!user) return res.status(404).json({ error: "User not found" });

  res.json({ ok: true, user });
});


router.delete("/:id", async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id))
    return res.status(400).json({ error: "Invalid user id" });

  const u = await User.findByIdAndDelete(req.params.id);
  if (!u) return res.status(404).json({ error: "User not found" });
  res.json({ ok: true });
});


router.post("/invite", async (req, res) => {
  const { email, name, isAdmin: makeAdmin = false } = req.body || {};
  if (!email) return res.status(400).json({ error: "email required" });

  let user = await User.findOne({ email });
  if (!user) {
    user = await User.create({
      email,
      name: name || "",
      isAdmin: !!makeAdmin,
      isSuspended: false,
    });
  }

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
  await Otp.create({ email: user.email, code, purpose: "signup", expiresAt });

  try {
    await sendMail({
      to: user.email,
      subject: "You're invited to Smart Trivia",
      text: `Hi${user.name ? " " + user.name : ""}, your OTP is ${code}. It expires in 10 minutes.`,
    });
  } catch (_) {}

  res.status(201).json({ ok: true, userId: user._id });
});

router.post("/:id/reset-password", async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id))
    return res.status(400).json({ error: "Invalid user id" });

  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ error: "User not found" });

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
  await Otp.create({ email: user.email, code, purpose: "reset", expiresAt });

  try {
    await sendMail({
      to: user.email,
      subject: "Password reset",
      text: `Your Smart Trivia reset code is ${code} (valid for 10 minutes).`,
    });
  } catch (_) {}

  res.json({ ok: true });
});

module.exports = router;
