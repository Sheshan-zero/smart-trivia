// server/routes/auth.js
const express = require("express");
const bcrypt = require("bcryptjs");
const rateLimit = require("express-rate-limit");
const { sendOtpEmail } = require("../utils/mailer");
const {
  signAccessToken,
  signRefreshToken,
  verifyRefresh,
} = require("../utils/jwt");
const { authRequired } = require("../middleware/auth");
const User = require("../models/User");
const Otp = require("../models/Otp");

const router = express.Router();

/* ----------------------------- Rate Limiters ----------------------------- */
const otpRequestLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 mins
  max: 5,
  message: { error: "Too many OTP requests. Please wait and try again." },
});

const otpVerifyLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 10,
  message: { error: "Too many attempts. Please wait and try again." },
});

/* --------------------------------- Utils -------------------------------- */
const normalizeEmail = (e) => String(e || "").trim().toLowerCase();
const random6 = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

function buildJwtPayload(user) {
  return {
    uid: user._id.toString(),
    email: user.email,
    role: user.role,               // "student" | "admin"
    isAdmin: user.role === "admin" // boolean for guards that check isAdmin
  };
}

function setRefreshCookie(res, refreshToken) {
  res.cookie("rt", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: "/",
  });
}

/* ------------------------------- OTP: Send ------------------------------- */
router.post("/request-otp", otpRequestLimiter, async (req, res) => {
  try {
    const { email, purpose } = req.body || {};
    const normalized = normalizeEmail(email);
    if (!normalized) return res.status(400).json({ error: "Email is required" });
    if (!["login", "reset"].includes(purpose))
      return res.status(400).json({ error: "Invalid purpose" });

    const code = random6();
    const codeHash = await bcrypt.hash(code, 10);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await Otp.create({
      email: normalized,
      codeHash,
      purpose,
      expiresAt,
      attempts: 0,
    });

    await sendOtpEmail(normalized, code);

    res.json({ ok: true, message: "OTP sent if the email is valid." });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to send OTP" });
  }
});

/* ------------------------------- OTP: Verify ------------------------------ */
router.post("/verify-otp", otpVerifyLimiter, async (req, res) => {
  try {
    const { email, code, purpose } = req.body || {};
    const normalized = normalizeEmail(email);
    if (!normalized || !code)
      return res.status(400).json({ error: "Email and code are required" });
    if (!["login", "reset"].includes(purpose))
      return res.status(400).json({ error: "Invalid purpose" });

    const otp = await Otp.findOne({ email: normalized, purpose }).sort({
      createdAt: -1,
    });
    if (!otp) return res.status(400).json({ error: "Invalid or expired code" });
    if (otp.expiresAt < new Date())
      return res.status(400).json({ error: "Code expired" });
    if (otp.attempts >= 5)
      return res.status(429).json({ error: "Too many attempts" });

    const ok = await bcrypt.compare(code, otp.codeHash);
    if (!ok) {
      otp.attempts += 1;
      await otp.save();
      return res.status(400).json({ error: "Invalid code" });
    }

    if (purpose === "reset") {
      // Client will proceed to /auth/reset-password with code
      return res.json({ ok: true, resetAllowed: true });
    }

    // purpose === "login"
    let user = await User.findOne({ email: normalized });
    if (!user) {
      user = await User.create({ email: normalized, role: "student" });
    }

    const payload = buildJwtPayload(user);
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);
    setRefreshCookie(res, refreshToken);

    res.json({
      ok: true,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        isAdmin: user.role === "admin",
      },
      accessToken,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Verification failed" });
  }
});

/* -------------------------------- Refresh -------------------------------- */
router.post("/refresh", async (req, res) => {
  try {
    const token = req.cookies?.rt;
    if (!token) return res.status(401).json({ error: "No refresh token" });

    const payload = verifyRefresh(token); // { uid, role, email, isAdmin } (maybe old)
    // Re-fetch user to honor role changes since the refresh was issued
    const user = await User.findById(payload.uid).select("email role");
    if (!user) return res.status(401).json({ error: "User not found" });

    const fresh = buildJwtPayload(user);
    const accessToken = signAccessToken(fresh);
    res.json({ ok: true, accessToken });
  } catch (e) {
    res.status(401).json({ error: "Invalid refresh token" });
  }
});

/* --------------------------------- Logout -------------------------------- */
router.post("/logout", (req, res) => {
  res.clearCookie("rt", { path: "/" });
  res.json({ ok: true });
});

/* --------------------------------- Signup -------------------------------- */
router.post("/signup", async (req, res) => {
  try {
    const { email, password, name, role } = req.body || {};
    const normalized = normalizeEmail(email);
    if (!normalized || !password)
      return res.status(400).json({ error: "Email and password required" });

    const existing = await User.findOne({ email: normalized });
    if (existing) return res.status(409).json({ error: "User already exists" });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      email: normalized,
      name: name || "",
      role: role === "admin" ? "admin" : "student",
      passwordHash,
    });

    const payload = buildJwtPayload(user);
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);
    setRefreshCookie(res, refreshToken);

    res.status(201).json({
      ok: true,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        isAdmin: user.role === "admin",
      },
      accessToken,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Signup failed" });
  }
});

/* ---------------------------- Login with Password --------------------------- */
router.post("/login-password", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    const normalized = normalizeEmail(email);
    if (!normalized || !password)
      return res.status(400).json({ error: "Email and password required" });

    const user = await User.findOne({ email: normalized });
    if (!user || !user.passwordHash)
      return res.status(401).json({ error: "Invalid credentials" });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });

    const payload = buildJwtPayload(user);
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);
    setRefreshCookie(res, refreshToken);

    res.json({
      ok: true,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        isAdmin: user.role === "admin",
      },
      accessToken,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Login failed" });
  }
});

/* ------------------------------ Reset Password ----------------------------- */
router.post("/reset-password", async (req, res) => {
  try {
    const { email, code, newPassword } = req.body || {};
    const normalized = normalizeEmail(email);
    if (!normalized || !code || !newPassword) {
      return res
        .status(400)
        .json({ error: "Email, code and newPassword are required" });
    }

    const otp = await Otp.findOne({ email: normalized, purpose: "reset" }).sort(
      { createdAt: -1 }
    );
    if (!otp) return res.status(400).json({ error: "Invalid or expired code" });
    if (otp.expiresAt < new Date())
      return res.status(400).json({ error: "Code expired" });

    const ok = await bcrypt.compare(code, otp.codeHash);
    if (!ok) return res.status(400).json({ error: "Invalid code" });

    const user = await User.findOne({ email: normalized });
    if (!user) return res.status(404).json({ error: "User not found" });

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ ok: true, message: "Password reset successful" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Reset failed" });
  }
});

/* ----------------------------------- Me ----------------------------------- */
router.get("/me", authRequired, async (req, res) => {
  try {
    const user = await User.findById(req.user.uid).select(
      "_id email role name createdAt"
    );
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({
      ok: true,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        name: user.name,
        isAdmin: user.role === "admin",
        createdAt: user.createdAt,
      },
    });
  } catch (e) {
    res.status(500).json({ error: "Failed to fetch profile" });
  }
});

module.exports = router;
