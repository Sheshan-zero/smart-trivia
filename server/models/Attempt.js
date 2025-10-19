const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const responseSchema = new Schema(
  {
    questionId: { type: Schema.Types.ObjectId, ref: "Question", required: true },
    chosenKeys: { type: [String], default: [] },
  },
  { _id: false }
);

const attemptSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", index: true, required: true },
    quizId: { type: Schema.Types.ObjectId, ref: "Quiz", index: true, required: true },
    startAt: { type: Date, required: true },
    endsAt: { type: Date, required: true },      
    submittedAt: { type: Date },
    status: { type: String, enum: ["started", "submitted", "expired"], default: "started" },
    responses: { type: [responseSchema], default: [] },
    score: { type: Number, default: 0 },
    durationSeconds: { type: Number, default: 0 },
  },
  { timestamps: true }
);

attemptSchema.index({ userId: 1, quizId: 1, status: 1 });

module.exports = model("Attempt", attemptSchema);
