import { useEffect, useMemo, useState } from "react";
import { api } from "../../api/http";
import {
  Panel,
  Field,
  Input,
  Textarea,
  Select,
  Button,
  Badge,
  Switch, 
} from "../../components/admin/ui.jsx";

const DEFAULT_OPTIONS = [
  { key: "A", text: "" },
  { key: "B", text: "" },
  { key: "C", text: "" },
  { key: "D", text: "" },
];

export default function AdminQuestions() {
  const [modules, setModules] = useState([]);
  const [moduleId, setModuleId] = useState("");
  const [quizzes, setQuizzes] = useState([]);
  const [quizId, setQuizId] = useState("");

  const [questions, setQuestions] = useState([]);
  const [qLoading, setQLoading] = useState(false);

  const [form, setForm] = useState({
    type: "mcq", 
    text: "",
    marks: 1,
    options: DEFAULT_OPTIONS,
    correctKeys: [],
  });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const [editing, setEditing] = useState(null); 
  const [savingEdit, setSavingEdit] = useState(false);
  const [filter, setFilter] = useState("");

  const loadModules = async () => {
    const { data } = await api.get("/admin/modules");
    setModules(data.modules || []);
  };
  const loadQuizzes = async (mid) => {
    if (!mid) return setQuizzes([]);
    const { data } = await api.get(`/admin/quizzes/${mid}`);
    setQuizzes(data.quizzes || []);
  };
  const loadQuestions = async (qid) => {
    setQLoading(true);
    try {
      if (!qid) return setQuestions([]);
      const { data } = await api.get(`/admin/questions/${qid}`);
      setQuestions(data.questions || []);
    } finally {
      setQLoading(false);
    }
  };

  useEffect(() => {
    loadModules();
  }, []);

  useEffect(() => {
    setQuizzes([]);
    setQuizId("");
    setQuestions([]);
    if (moduleId) loadQuizzes(moduleId);
  }, [moduleId]);

  useEffect(() => {
    setQuestions([]);
    if (quizId) loadQuestions(quizId);
  }, [quizId]);

  useEffect(() => {
    setMsg("");
    if (form.type === "truefalse") {
      setForm((f) => ({
        ...f,
        options: [
          { key: "A", text: "True" },
          { key: "B", text: "False" },
        ],
        correctKeys: [],
      }));
    } else if (form.options.length < 3) {
      setForm((f) => ({ ...f, options: DEFAULT_OPTIONS, correctKeys: [] }));
    }
  }, [form.type]);

  const updateOption = (i, text) => {
    const copy = [...form.options];
    copy[i] = { ...copy[i], text };
    setForm({ ...form, options: copy });
  };

  const toggleCorrect = (key) => {
    const set = new Set(form.correctKeys);
    if (set.has(key)) set.delete(key);
    else set.add(key);

    if (form.type !== "multi" && set.size > 1) {
      set.clear();
      set.add(key);
    }
    setForm({ ...form, correctKeys: [...set] });
  };

  const validateForm = () => {
    if (!quizId) return "Please select a quiz";
    if (!form.text.trim()) return "Question text is required";
    if (!Number(form.marks) || Number(form.marks) < 1) return "Marks must be at least 1";
    const nonEmptyOpts = (form.options || []).filter((o) => o.text && o.text.trim());
    if (form.type !== "truefalse" && nonEmptyOpts.length < 2) {
      return "Please fill at least two options";
    }
    if (form.correctKeys.length === 0) return "Please mark at least one correct answer";
    return null;
  };

  const addQuestion = async (e) => {
    e.preventDefault();
    setMsg("");
    const v = validateForm();
    if (v) {
      setMsg(v);
      return;
    }
    setBusy(true);
    try {
      await api.post("/admin/questions", { ...form, quizId });
      setForm({
        type: "mcq",
        text: "",
        marks: 1,
        options: DEFAULT_OPTIONS,
        correctKeys: [],
      });
      await loadQuestions(quizId);
      setMsg("Question added");
    } catch (e) {
      setMsg(e.response?.data?.error || "Failed");
    } finally {
      setBusy(false);
    }
  };

  const startEdit = (q) => {
    setEditing({
      _id: q._id,
      type: q.type || "mcq",
      text: q.text || "",
      marks: q.marks || 1,
      options: (q.options?.length ? q.options : DEFAULT_OPTIONS).map((o) => ({ ...o })),
      correctKeys: [...(q.correctKeys || [])],
    });
  };

  const editUpdateOption = (i, text) => {
    const copy = [...editing.options];
    copy[i] = { ...copy[i], text };
    setEditing({ ...editing, options: copy });
  };

  const editToggleCorrect = (key) => {
    const set = new Set(editing.correctKeys);
    if (set.has(key)) set.delete(key);
    else set.add(key);
    if (editing.type !== "multi" && set.size > 1) {
      set.clear();
      set.add(key);
    }
    setEditing({ ...editing, correctKeys: [...set] });
  };

  const saveEdit = async (e) => {
    e?.preventDefault?.();
    if (!editing?._id) return;
    setSavingEdit(true);
    try {
      const payload = {
        type: editing.type,
        text: editing.text,
        marks: editing.marks,
        options: editing.options,
        correctKeys: editing.correctKeys,
      };
      await api.patch(`/admin/question/${editing._id}`, payload);
      setEditing(null);
      await loadQuestions(quizId);
    } catch (err) {
      alert(err.response?.data?.error || "Update failed");
    } finally {
      setSavingEdit(false);
    }
  };

  const deleteQuestion = async (q) => {
    if (!window.confirm("Delete this question? This cannot be undone.")) return;
    try {
      await api.delete(`/admin/question/${q._id}`);
      await loadQuestions(quizId);
    } catch (e) {
      alert(e.response?.data?.error || "Delete failed");
    }
  };

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return questions;
    return questions.filter((x) => (x.text || "").toLowerCase().includes(q));
  }, [questions, filter]);

  return (
    <div className="ad-dashboard">
      <h2>Manage Questions</h2>

      <div className="ad-grid-3">
        <Panel title="Pick Module">
          <Field label="Module">
            <Select value={moduleId} onChange={(e) => setModuleId(e.target.value)}>
              <option value="">-- Select --</option>
              {modules.map((m) => (
                <option key={m._id} value={m._id}>
                  {m.title}
                </option>
              ))}
            </Select>
          </Field>
        </Panel>

        <Panel title="Pick Quiz">
          <Field label="Quiz">
            <Select value={quizId} onChange={(e) => setQuizId(e.target.value)} disabled={!moduleId}>
              <option value="">-- Select --</option>
              {quizzes.map((q) => (
                <option key={q._id} value={q._id}>
                  {q.title}
                </option>
              ))}
            </Select>
          </Field>
        </Panel>

        <Panel title="Question Type">
          <Field label="Type">
            <Select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value, correctKeys: [] })}
            >
              <option value="mcq">Single choice (MCQ)</option>
              <option value="multi">Multiple correct</option>
              <option value="truefalse">True / False</option>
            </Select>
          </Field>
        </Panel>
      </div>

      {quizId ? (
        <div className="ad-grid-2" style={{ marginTop: 16 }}>
          <Panel title="Create Question">
            <form onSubmit={addQuestion}>
              <Field label="Question text">
                <Textarea
                  value={form.text}
                  onChange={(e) => setForm({ ...form, text: e.target.value })}
                  required
                />
              </Field>

              <Field label="Marks">
                <Input
                  type="number"
                  min={1}
                  value={form.marks}
                  onChange={(e) => setForm({ ...form, marks: Number(e.target.value) })}
                />
              </Field>

              {(form.options || []).map((o, i) => (
                <div key={o.key} className="ad-grid-2" style={{ alignItems: "center" }}>
                  <Field label={`Option ${o.key}`}>
                    <Input
                      value={o.text}
                      onChange={(e) => updateOption(i, e.target.value)}
                      disabled={form.type === "truefalse"}
                      required={form.type !== "truefalse"}
                    />
                  </Field>
                  <Field label="Correct?">
                    <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <input
                        type="checkbox"
                        checked={form.correctKeys.includes(o.key)}
                        onChange={() => toggleCorrect(o.key)}
                      />
                      <span>Mark as correct</span>
                    </label>
                  </Field>
                </div>
              ))}

              <Button disabled={busy}>{busy ? "Saving..." : "Add Question"}</Button>
              {msg && (
                <div style={{ marginTop: 8 }}>
                  <Badge tone={msg.toLowerCase().includes("fail") ? "muted" : "success"}>{msg}</Badge>
                </div>
              )}
            </form>
          </Panel>

          <Panel
            title={`Questions (${filtered.length}${filter ? `/${questions.length}` : `/${questions.length}`})`}
            right={
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <Input placeholder="Search…" value={filter} onChange={(e) => setFilter(e.target.value)} />
                <Button variant="ghost" onClick={() => loadQuestions(quizId)}>
                  Refresh
                </Button>
              </div>
            }
          >
            {qLoading ? (
              <div style={{ padding: 12 }}>Loading…</div>
            ) : filtered.length === 0 ? (
              <div style={{ padding: 12, color: "#6b7280" }}>
                {questions.length === 0 ? "No questions yet." : "No questions match your search."}
              </div>
            ) : (
              <ol style={{ margin: 0, paddingLeft: 18 }}>
                {filtered.map((q) => (
                  <li key={q._id} style={{ marginBottom: 12 }}>
                    <div style={{ fontWeight: 600 }}>{q.text}</div>
                    <div style={{ margin: "6px 0", display: "flex", gap: 8, alignItems: "center" }}>
                      <Badge tone="muted">{q.type}</Badge>
                      <Badge tone="muted">{q.marks} mark(s)</Badge>
                      <span style={{ flex: 1 }} />
                      <Button variant="ghost" onClick={() => startEdit(q)}>
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => deleteQuestion(q)}
                        style={{ color: "#b91c1c" }}
                      >
                        Delete
                      </Button>
                    </div>
                    <ul style={{ margin: "6px 0 0 16px" }}>
                      {q.options.map((o) => (
                        <li key={o.key}>
                          <strong>{o.key}.</strong> {o.text}{" "}
                          {q.correctKeys?.includes(o.key) && <Badge tone="success">Correct</Badge>}
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ol>
            )}
          </Panel>
        </div>
      ) : (
        <Panel title="Questions">
          <div style={{ padding: 12, color: "#6b7280" }}>Pick a module & quiz to manage questions.</div>
        </Panel>
      )}

      {editing && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.35)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 50,
          }}
          onClick={() => !savingEdit && setEditing(null)}
        >
          <div
            className="ad-panel"
            style={{ width: 640, maxWidth: "94%", background: "#fff" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="ad-panel-title">
              <span>Edit Question</span>
              <span>
                <Button variant="ghost" onClick={() => !savingEdit && setEditing(null)}>
                  Close
                </Button>
              </span>
            </div>
            <div className="ad-panel-body">
              <form onSubmit={saveEdit}>
                <Field label="Type">
                  <Select
                    value={editing.type}
                    onChange={(e) => {
                      const t = e.target.value;
                      if (t === "truefalse") {
                        setEditing({
                          ...editing,
                          type: t,
                          options: [
                            { key: "A", text: "True" },
                            { key: "B", text: "False" },
                          ],
                          correctKeys: [],
                        });
                      } else {
                        const opts =
                          editing.options.length >= 4 ? editing.options : DEFAULT_OPTIONS.map((d, i) => editing.options[i] || d);
                        setEditing({ ...editing, type: t, options: opts, correctKeys: [] });
                      }
                    }}
                  >
                    <option value="mcq">Single choice (MCQ)</option>
                    <option value="multi">Multiple correct</option>
                    <option value="truefalse">True / False</option>
                  </Select>
                </Field>

                <Field label="Question text">
                  <Textarea
                    value={editing.text}
                    onChange={(e) => setEditing({ ...editing, text: e.target.value })}
                    required
                  />
                </Field>

                <Field label="Marks">
                  <Input
                    type="number"
                    min={1}
                    value={editing.marks}
                    onChange={(e) => setEditing({ ...editing, marks: Number(e.target.value) })}
                  />
                </Field>

                {(editing.options || []).map((o, i) => (
                  <div key={o.key} className="ad-grid-2" style={{ alignItems: "center" }}>
                    <Field label={`Option ${o.key}`}>
                      <Input
                        value={o.text}
                        onChange={(e) => editUpdateOption(i, e.target.value)}
                        disabled={editing.type === "truefalse"}
                        required={editing.type !== "truefalse"}
                      />
                    </Field>
                    <Field label="Correct?">
                      <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <input
                          type="checkbox"
                          checked={editing.correctKeys.includes(o.key)}
                          onChange={() => editToggleCorrect(o.key)}
                        />
                        <span>Mark as correct</span>
                      </label>
                    </Field>
                  </div>
                ))}

                <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                  <Button disabled={savingEdit} type="submit">
                    {savingEdit ? "Saving…" : "Save changes"}
                  </Button>
                  <Button variant="ghost" onClick={() => !savingEdit && setEditing(null)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
