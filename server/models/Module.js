const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const moduleSchema = new Schema(
  {
    title: { type: String, required: true },
    code: { type: String, required: true, unique: true, index: true },
    description: { type: String, default: "" },
    isActive: { type: Boolean, default: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

module.exports = model("Module", moduleSchema);
