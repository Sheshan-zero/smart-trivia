const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const optionSchema = new Schema(
  { key: { type: String, required: true }, text: { type: String, required: true } },
  { _id: false }
);

const questionSchema = new Schema(
  {
    quizId: { type: Schema.Types.ObjectId, ref: "Quiz", required: true, index: true },
    type: { type: String, enum: ["mcq", "multi", "truefalse"], default: "mcq" },
    text: { type: String, required: true },
    options: { type: [optionSchema], default: [] },
    correctKeys: { type: [String], default: [] },
    marks: { type: Number, default: 1 },
  },
  { timestamps: true }
);

module.exports = model("Question", questionSchema);
