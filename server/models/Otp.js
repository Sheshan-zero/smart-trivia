const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const otpSchema = new Schema(
  {
    email: { type: String, required: true, index: true },
    codeHash: { type: String, required: true },
    purpose: { type: String, enum: ["login", "reset"], required: true },
    expiresAt: { type: Date, required: true },
    attempts: { type: Number, default: 0 },
  },
  { timestamps: true }
);


otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = model("Otp", otpSchema);
