const express = require("express");
const mongoose = require("mongoose");
const { authRequired, isAdmin } = require("../middleware/auth");
const Module = require("../models/Module");
const Quiz = require("../models/Quiz");
const Question = require("../models/Question");
const User = require("../models/User");

const router = express.Router();
router.use(authRequired, isAdmin);

router.get("/stats", async (req, res) => {
  try {
    const [users, quizzes] = await Promise.all([
      User.countDocuments(),
      Quiz.countDocuments(),
    ]);
    res.json({ ok: true, users, quizzes, reports: 0, approvals: 3 });
  } catch (e) {
    res.status(500).json({ error: "Failed to load stats" });
  }
});

router.post("/modules", async (req, res) => {
  try {
    const { title, code, description, isActive = true } = req.body || {};
    if (!title || !code)
      return res.status(400).json({ error: "title and code required" });
    const mod = await Module.create({
      title,
      code,
      description,
      isActive,
      createdBy: req.user.uid,
    });
    res.status(201).json({ ok: true, module: mod });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get("/modules", async (req, res) => {
  try {
    const list = await Module.find().sort({ createdAt: -1 });
    res.json({ ok: true, modules: list });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.patch("/modules/:id", async (req, res) => {
  try {
    const update = req.body || {};
    const mod = await Module.findByIdAndUpdate(req.params.id, update, {
      new: true,
    });
    if (!mod) return res.status(404).json({ error: "Module not found" });
    res.json({ ok: true, module: mod });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.delete("/modules/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id))
      return res.status(400).json({ error: "Invalid module id" });

    const mod = await Module.findById(id);
    if (!mod) return res.status(404).json({ error: "Module not found" });

    const quizIds = (await Quiz.find({ moduleId: id }).select("_id")).map(
      (q) => q._id
    );

    if (quizIds.length > 0 && String(req.query.force) !== "true") {
      return res.status(400).json({
        error:
          "Module has quizzes. Pass ?force=true to delete quizzes & questions too.",
      });
    }

    if (quizIds.length > 0) {
      await Question.deleteMany({ quizId: { $in: quizIds } });
      await Quiz.deleteMany({ _id: { $in: quizIds } });
    }

    await Module.findByIdAndDelete(id);
    res.json({ ok: true, deletedQuizzes: quizIds.length });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post("/quizzes", async (req, res) => {
  try {
    const {
      moduleId,
      title,
      description = "",
      durationSeconds,
      isPublished = false,
    } = req.body || {};
    if (!moduleId || !title || !durationSeconds)
      return res
        .status(400)
        .json({ error: "moduleId, title, durationSeconds required" });

    const quiz = await Quiz.create({
      moduleId,
      title,
      description,
      durationSeconds,
      isPublished,
      createdBy: req.user.uid,
    });
    res.status(201).json({ ok: true, quiz });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get("/quizzes/:moduleId", async (req, res) => {
  try {
    const quizzes = await Quiz.find({
      moduleId: req.params.moduleId,
    }).sort({ createdAt: -1 });
    res.json({ ok: true, quizzes });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.patch("/quiz/:id", async (req, res) => {
  try {
    const quiz = await Quiz.findByIdAndUpdate(req.params.id, req.body || {}, {
      new: true,
    });
    if (!quiz) return res.status(404).json({ error: "Quiz not found" });
    res.json({ ok: true, quiz });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.delete("/quiz/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id))
      return res.status(400).json({ error: "Invalid quiz id" });

    const quiz = await Quiz.findById(id);
    if (!quiz) return res.status(404).json({ error: "Quiz not found" });


    await Question.deleteMany({ quizId: id });
    await Quiz.findByIdAndDelete(id);

    res.json({ ok: true, deleted: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post("/questions", async (req, res) => {
  try {
    const {
      quizId,
      type = "mcq",
      text,
      options = [],
      correctKeys = [],
      marks = 1,
    } = req.body || {};
    if (!quizId || !text)
      return res.status(400).json({ error: "quizId and text required" });
    if (type !== "multi" && correctKeys.length > 1)
      return res
        .status(400)
        .json({ error: "Only one correct key allowed for this type" });

    const q = await Question.create({
      quizId,
      type,
      text,
      options,
      correctKeys,
      marks,
    });
    res.status(201).json({ ok: true, question: q });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get("/questions/:quizId", async (req, res) => {
  try {
    const qs = await Question.find({ quizId: req.params.quizId }).sort({
      createdAt: 1,
    });
    res.json({ ok: true, questions: qs });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.patch("/question/:id", async (req, res) => {
  try {
    const q = await Question.findByIdAndUpdate(req.params.id, req.body || {}, {
      new: true,
    });
    if (!q) return res.status(404).json({ error: "Question not found" });
    res.json({ ok: true, question: q });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.delete("/question/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id))
      return res.status(400).json({ error: "Invalid question id" });

    const q = await Question.findByIdAndDelete(id);
    if (!q) return res.status(404).json({ error: "Question not found" });

    res.json({ ok: true, deleted: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
