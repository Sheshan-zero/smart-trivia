require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const mongoose = require("mongoose");

const app = express();
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173", credentials: true }));
app.use(express.json());
app.use(cookieParser());

const MONGO_URI = process.env.MONGO_URI;
mongoose
  .connect(MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => {
    console.error("MongoDB connection error:", err.message);
    process.exit(1);
  });

const { Schema, model } = mongoose;

const userSchema = new Schema(
  {
    name: { type: String },
    email: { type: String, required: true, unique: true, index: true },
    passwordHash: { type: String }, // for later (non-OTP login optional)
    role: { type: String, enum: ["student", "admin"], default: "student" },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);
const User = model("User", userSchema);

const otpSchema = new Schema(
  {
    email: { type: String, required: true, index: true },
    codeHash: { type: String, required: true },
    purpose: { type: String, enum: ["login", "reset"], required: true },
    expiresAt: { type: Date, required: true, index: true },
    attempts: { type: Number, default: 0 },
  },
  { timestamps: true }
);

otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
const Otp = model("Otp", otpSchema);

app.get("/health", async (req, res) => {
  const dbState = mongoose.connection.readyState; // 1 = connected
  res.json({
    ok: true,
    service: "smart-trivia-api",
    dbConnected: dbState === 1,
    time: new Date().toISOString(),
  });
});

app.post("/api/dev/create-test-user", async (req, res) => {
  try {
    const { email = "student@example.com", name = "Test Student" } = req.body || {};
    const existing = await User.findOne({ email });
    if (existing) {
      return res.json({ created: false, user: existing });
    }
    const user = await User.create({ email, name, role: "student" });
    res.json({ created: true, user });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get("/api/dev/users", async (req, res) => {
  const users = await User.find().sort({ createdAt: -1 }).limit(20);
  res.json({ count: users.length, users });
});

app.get("/api/greeting", (req, res) => {
  res.json({ message: "Hello from Smart Trivia API 👋" });
});


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`API running at http://localhost:${PORT}`);
});
