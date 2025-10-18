const express = require("express");
const { authRequired } = require("../middleware/auth");
const Attempt = require("../models/Attempt");
const Quiz = require("../models/Quiz");
const Question = require("../models/Question");

const router = express.Router();
router.use(authRequired);

const eq = (a = [], b = []) => {
  if (a.length !== b.length) return false;
  const as = new Set(a), bs = new Set(b);
  for (const k of as) if (!bs.has(k)) return false;
  return true;
};

router.post("/start", async (req, res) => {
  const { quizId } = req.body || {};
  if (!quizId) return res.status(400).json({ error: "quizId required" });

  const quiz = await Quiz.findById(quizId);
  if (!quiz || !quiz.isPublished) return res.status(404).json({ error: "Quiz not available" });

  const now = new Date();
  let attempt = await Attempt.findOne({
    userId: req.user.uid,
    quizId,
    status: "started",
  }).sort({ createdAt: -1 });

  if (attempt && attempt.endsAt > now) {
    return res.json({
      ok: true,
      attemptId: attempt._id,
      startAt: attempt.startAt,
      endsAt: attempt.endsAt,
      status: attempt.status,
      resume: true
    });
  }

  const startAt = now;
  const endsAt = new Date(startAt.getTime() + quiz.durationSeconds * 1000);
  attempt = await Attempt.create({
    userId: req.user.uid,
    quizId,
    startAt,
    endsAt,
    status: "started",
  });

  res.status(201).json({
    ok: true,
    attemptId: attempt._id,
    startAt,
    endsAt,
    status: attempt.status,
    resume: false
  });
});

router.get("/:id", async (req, res) => {
  const att = await Attempt.findById(req.params.id);
  if (!att || String(att.userId) !== String(req.user.uid))
    return res.status(404).json({ error: "Attempt not found" });

  res.json({
    ok: true,
    attempt: {
      id: att._id,
      quizId: att.quizId,
      startAt: att.startAt,
      endsAt: att.endsAt,
      status: att.status,
      responses: att.responses,
      submittedAt: att.submittedAt,
      score: att.score
    }
  });
});

router.post("/:id/save", async (req, res) => {
  const att = await Attempt.findById(req.params.id);
  if (!att || String(att.userId) !== String(req.user.uid))
    return res.status(404).json({ error: "Attempt not found" });
  if (att.status !== "started") return res.status(400).json({ error: "Attempt not active" });
  const map = new Map(att.responses.map(r => [String(r.questionId), r]));
  for (const r of (req.body?.responses || [])) {
    map.set(String(r.questionId), { questionId: r.questionId, chosenKeys: r.chosenKeys || [] });
  }
  att.responses = [...map.values()];
  await att.save();
  res.json({ ok: true });
});

router.post("/:id/submit", async (req, res) => {
  const GRACE_MS = 10 * 1000; // 10s grace
  const att = await Attempt.findById(req.params.id);
  if (!att || String(att.userId) !== String(req.user.uid))
    return res.status(404).json({ error: "Attempt not found" });
  if (att.status !== "started") return res.status(400).json({ error: "Already submitted" });

  const map = new Map(att.responses.map(r => [String(r.questionId), r]));
  for (const r of (req.body?.responses || [])) {
    map.set(String(r.questionId), { questionId: r.questionId, chosenKeys: r.chosenKeys || [] });
  }
  att.responses = [...map.values()];

  const now = new Date();
  const expired = now.getTime() > att.endsAt.getTime() + GRACE_MS;
  if (expired) {
    att.status = "expired";
    att.submittedAt = now;
    att.durationSeconds = Math.round((now - att.startAt) / 1000);
    await att.save();
    return res.status(400).json({ error: "Time up. Attempt expired." });
  }

  const questions = await Question.find({ quizId: att.quizId }).select("_id correctKeys marks");
  const qMap = new Map(questions.map(q => [String(q._id), q]));
  let score = 0;
  const review = [];
  for (const r of att.responses) {
    const q = qMap.get(String(r.questionId));
    if (!q) continue;
    const correct = eq((r.chosenKeys || []).sort(), (q.correctKeys || []).sort());
    if (correct) score += q.marks || 1;
    review.push({
      questionId: r.questionId,
      chosenKeys: r.chosenKeys || [],
      correctKeys: q.correctKeys || [],
      marks: q.marks || 1,
      correct
    });
  }

  att.status = "submitted";
  att.submittedAt = now;
  att.durationSeconds = Math.round((now - att.startAt) / 1000);
  att.score = score;
  await att.save();

  res.json({ ok: true, score, durationSeconds: att.durationSeconds, review });
});

router.get("/:id/result", async (req, res) => {
  const att = await Attempt.findById(req.params.id);
  if (!att || String(att.userId) !== String(req.user.uid))
    return res.status(404).json({ error: "Attempt not found" });
  if (att.status !== "submitted") return res.status(400).json({ error: "Not submitted yet" });

  const qs = await Question.find({ quizId: att.quizId }).select("_id text options correctKeys marks");
  const qMap = new Map(qs.map(q => [String(q._id), q]));
  const breakdown = att.responses.map(r => {
    const q = qMap.get(String(r.questionId));
    if (!q) return null;
    const correct = eq((r.chosenKeys || []).sort(), (q.correctKeys || []).sort());
    return {
      questionId: q._id,
      text: q.text,
      options: q.options,
      chosenKeys: r.chosenKeys || [],
      correctKeys: q.correctKeys || [],
      marks: q.marks || 1,
      correct
    };
  }).filter(Boolean);

  res.json({
    ok: true,
    score: att.score,
    durationSeconds: att.durationSeconds,
    breakdown
  });
});

module.exports = router;
