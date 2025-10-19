const express = require("express");
const { authRequired } = require("../middleware/auth");
const Module = require("../models/Module");
const Quiz = require("../models/Quiz");
const Question = require("../models/Question");
const router = express.Router();

router.get("/modules", authRequired, async (req, res) => {
  const mods = await Module.find({ isActive: true }).select("_id title code description");
  res.json({ ok: true, modules: mods });
});

router.get("/modules/:moduleId/quizzes", authRequired, async (req, res) => {
  const qs = await Quiz.find({ moduleId: req.params.moduleId, isPublished: true })
    .select("_id title description durationSeconds createdAt");
  res.json({ ok: true, quizzes: qs });
});

router.get("/quizzes/:quizId/questions", authRequired, async (req, res) => {
  const qs = await Question.find({ quizId: req.params.quizId })
    .select("_id type text options marks createdAt");
  res.json({ ok: true, questions: qs });
});

module.exports = router;
