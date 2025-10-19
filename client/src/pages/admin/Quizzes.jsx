import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
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

export default function AdminQuizzes() {
  const nav = useNavigate();
  const [modules, setModules] = useState([]);
  const [moduleId, setModuleId] = useState("");
  const [quizzes, setQuizzes] = useState([]);
  const [qLoading, setQLoading] = useState(false);

  const [form, setForm] = useState({
    title: "",
    description: "",
    durationSeconds: 600,
    isPublished: false,
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
    setQLoading(true);
    try {
      if (!mid) return setQuizzes([]);
      const { data } = await api.get(`/admin/quizzes/${mid}`);
      setQuizzes(data.quizzes || []);
    } finally {
      setQLoading(false);
    }
  };

  useEffect(() => {
    loadModules();
  }, []);
  useEffect(() => {
    setQuizzes([]);
    if (moduleId) loadQuizzes(moduleId);
  }, [moduleId]);

  const durLabel = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
  };
  const validateCreate = () => {
    if (!moduleId) return "Pick a module first";
    if (!form.title.trim()) return "Title is required";
    if (!Number(form.durationSeconds) || Number(form.durationSeconds) < 30)
      return "Duration must be at least 30 seconds";
    return null;
  };

  const createQuiz = async (e) => {
    e.preventDefault();
    setMsg("");
    const v = validateCreate();
    if (v) {
      setMsg(v);
      return;
    }
    setBusy(true);
    try {
      await api.post("/admin/quizzes", { ...form, moduleId });
      setForm({ title: "", description: "", durationSeconds: 600, isPublished: false });
      setMsg("Quiz created");
      await loadQuizzes(moduleId);
    } catch (e) {
      setMsg(e.response?.data?.error || "Failed");
    } finally {
      setBusy(false);
    }
  };

  const togglePublish = async (q) => {
    const prev = [...quizzes];
    const next = quizzes.map((x) =>
      x._id === q._id ? { ...x, isPublished: !x.isPublished } : x
    );
    setQuizzes(next);
    try {
      await api.patch(`/admin/quiz/${q._id}`, { isPublished: !q.isPublished });
    } catch (e) {
      setQuizzes(prev);
      alert(e.response?.data?.error || "Failed to update publish status");
    }
  };

  const startEdit = (q) => {
    setEditing({
      _id: q._id,
      title: q.title || "",
      description: q.description || "",
      durationSeconds: q.durationSeconds || 600,
      isPublished: !!q.isPublished,
    });
  };

  const saveEdit = async (e) => {
    e?.preventDefault?.();
    if (!editing?._id) return;
    setSavingEdit(true);
    try {
      const payload = {
        title: editing.title,
        description: editing.description,
        durationSeconds: Number(editing.durationSeconds),
        isPublished: !!editing.isPublished,
      };
      if (!payload.title.trim()) throw new Error("Title is required");
      if (!payload.durationSeconds || payload.durationSeconds < 30)
        throw new Error("Duration must be at least 30 seconds");

      await api.patch(`/admin/quiz/${editing._id}`, payload);
      setEditing(null);
      await loadQuizzes(moduleId);
    } catch (err) {
      alert(err.response?.data?.error || err.message || "Update failed");
    } finally {
      setSavingEdit(false);
    }
  };

  const deleteQuiz = async (q) => {
    if (!window.confirm("Delete this quiz? All its questions will also be deleted.")) return;
    try {
      await api.delete(`/admin/quiz/${q._id}`);
      await loadQuizzes(moduleId);
    } catch (e) {
      alert(e.response?.data?.error || "Delete failed");
    }
  };

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return quizzes;
    return quizzes.filter(
      (x) =>
        (x.title || "").toLowerCase().includes(q) ||
        (x.description || "").toLowerCase().includes(q)
    );
  }, [quizzes, filter]);

  return (
    <div className="ad-dashboard">
      <h2>Manage Quizzes</h2>

      <Panel title="Select Module">
        <Field label="Module">
          <Select value={moduleId} onChange={(e) => setModuleId(e.target.value)}>
            <option value="">-- Choose module --</option>
            {modules.map((m) => (
              <option key={m._id} value={m._id}>
                {m.title} ({m.code})
              </option>
            ))}
          </Select>
        </Field>
      </Panel>

      {moduleId && (
        <div className="ad-grid-2">
          <Panel title="Create Quiz">
            <form onSubmit={createQuiz}>
              <Field label="Title">
                <Input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                />
              </Field>

              <Field label="Description">
                <Textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </Field>

              <Field label="Duration (seconds)">
                <Input
                  type="number"
                  min={30}
                  value={form.durationSeconds}
                  onChange={(e) =>
                    setForm({ ...form, durationSeconds: Number(e.target.value) })
                  }
                />
              </Field>

              <Field label="Published">
                <Switch
                  checked={form.isPublished}
                  onChange={(v) => setForm({ ...form, isPublished: v })}
                />
              </Field>

              <Button disabled={busy}>{busy ? "Saving..." : "Add Quiz"}</Button>
              {msg && (
                <div style={{ marginTop: 8 }}>
                  <Badge tone={msg.toLowerCase().includes("fail") ? "muted" : "success"}>
                    {msg}
                  </Badge>
                </div>
              )}
            </form>
          </Panel>

          <Panel
            title={`Quizzes (${filtered.length}${
              filter ? `/${quizzes.length}` : `/${quizzes.length}`
            })`}
            right={
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <Input
                  placeholder="Search…"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                />
                <Button variant="ghost" onClick={() => loadQuizzes(moduleId)}>
                  Refresh
                </Button>
              </div>
            }
          >
            {qLoading ? (
              <div style={{ padding: 12 }}>Loading…</div>
            ) : filtered.length === 0 ? (
              <div style={{ padding: 12, color: "#6b7280" }}>
                {quizzes.length === 0 ? "No quizzes yet." : "No quizzes match your search."}
              </div>
            ) : (
              <table className="ad-table">
                <thead>
                  <tr>
                    <th className="ad-th">Title</th>
                    <th className="ad-th">Duration</th>
                    <th className="ad-th">Status</th>
                    <th className="ad-th">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((q) => (
                    <tr key={q._id} className="ad-tr ad-row">
                      <td className="ad-td">
                        <strong>{q.title}</strong>
                        {q.description && (
                          <div className="ad-field-hint">{q.description}</div>
                        )}
                      </td>
                      <td className="ad-td">{durLabel(q.durationSeconds)}</td>
                      <td className="ad-td">
                        {q.isPublished ? (
                          <Badge tone="success">Published</Badge>
                        ) : (
                          <Badge>Draft</Badge>
                        )}
                      </td>
                      <td className="ad-td ad-actions" style={{ display: "flex", gap: 8 }}>
                        <Switch
                          checked={q.isPublished}
                          onChange={() => togglePublish(q)}
                        />
                        <Button variant="ghost" onClick={() => startEdit(q)}>
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          onClick={() => deleteQuiz(q)}
                          style={{ color: "#b91c1c" }}
                        >
                          Delete
                        </Button>
                        <Button
                          variant="ghost"
                          onClick={() => nav("/admin/questions")}
                          title="Go manage questions"
                        >
                          Questions
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Panel>
        </div>
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
              <span>Edit Quiz</span>
              <span>
                <Button variant="ghost" onClick={() => !savingEdit && setEditing(null)}>
                  Close
                </Button>
              </span>
            </div>
            <div className="ad-panel-body">
              <form onSubmit={saveEdit}>
                <Field label="Title">
                  <Input
                    value={editing.title}
                    onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                    required
                  />
                </Field>

                <Field label="Description">
                  <Textarea
                    value={editing.description}
                    onChange={(e) =>
                      setEditing({ ...editing, description: e.target.value })
                    }
                  />
                </Field>

                <Field label="Duration (seconds)">
                  <Input
                    type="number"
                    min={30}
                    value={editing.durationSeconds}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        durationSeconds: Number(e.target.value),
                      })
                    }
                  />
                </Field>

                <Field label="Published">
                  <Switch
                    checked={!!editing.isPublished}
                    onChange={(v) => setEditing({ ...editing, isPublished: v })}
                  />
                </Field>

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
