import { useEffect, useState } from "react";
import { api } from "../../api/http";

export default function AdminQuizzes() {
  const [modules, setModules] = useState([]);
  const [moduleId, setModuleId] = useState("");
  const [quizzes, setQuizzes] = useState([]);
  const [form, setForm] = useState({ title: "", description: "", durationSeconds: 300, isPublished: false });
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.get("/admin/modules").then(({ data }) => setModules(data.modules || []));
  }, []);

  useEffect(() => {
    if (moduleId) api.get(`/admin/quizzes/${moduleId}`).then(({ data }) => setQuizzes(data.quizzes || []));
  }, [moduleId]);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setMsg("");
    try {
      await api.post("/admin/quizzes", { ...form, moduleId });
      setForm({ title: "", description: "", durationSeconds: 300, isPublished: false });
      const { data } = await api.get(`/admin/quizzes/${moduleId}`);
      setQuizzes(data.quizzes || []);
      setMsg("Quiz created");
    } catch (e) {
      setMsg(e.response?.data?.error || "Failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ maxWidth: 960, margin: "30px auto" }}>
      <h2>Quizzes</h2>

      <label>Module</label>
      <select value={moduleId} onChange={(e)=>setModuleId(e.target.value)}>
        <option value="">-- Select module --</option>
        {modules.map(m => <option key={m._id} value={m._id}>{m.title} ({m.code})</option>)}
      </select>

      {moduleId && (
        <>
          <form onSubmit={submit} style={{ display: "grid", gap: 8, maxWidth: 520, marginTop: 10 }}>
            <input placeholder="Title" value={form.title} onChange={(e)=>setForm({...form, title:e.target.value})} required />
            <textarea placeholder="Description" value={form.description} onChange={(e)=>setForm({...form, description:e.target.value})} />
            <input type="number" min={30} placeholder="Duration (seconds)" value={form.durationSeconds} onChange={(e)=>setForm({...form, durationSeconds:Number(e.target.value)})}/>
            <label><input type="checkbox" checked={form.isPublished} onChange={(e)=>setForm({...form, isPublished:e.target.checked})}/> Published</label>
            <button disabled={busy}>{busy ? "Saving..." : "Add Quiz"}</button>
            {msg && <small>{msg}</small>}
          </form>

          <hr style={{ margin: "20px 0" }} />

          <ul>
            {quizzes.map(q => (
              <li key={q._id}><strong>{q.title}</strong> — {q.durationSeconds}s — {q.isPublished ? "Published" : "Draft"}</li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
