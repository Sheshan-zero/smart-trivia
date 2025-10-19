const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const userSchema = new Schema(
  {
    name: { type: String },
    email: { type: String, required: true, unique: true, index: true },
    passwordHash: { type: String },
    role: { type: String, enum: ["student", "admin"], default: "student" },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

userSchema.virtual("isAdmin").get(function () {
  return this.role === "admin";
});

module.exports = model("User", userSchema);
