const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const quizSchema = new Schema(
  {
    moduleId: { type: Schema.Types.ObjectId, ref: "Module", required: true, index: true },
    title: { type: String, required: true },
    description: { type: String, default: "" },
    durationSeconds: { type: Number, required: true, min: 30 },
    totalMarks: { type: Number, default: 0 }, 
    isPublished: { type: Boolean, default: false },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

module.exports = model("Quiz", quizSchema);
