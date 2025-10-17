import { useEffect, useState } from "react";
import { api } from "../../api/http";
import { Panel, Field, Input, Textarea, Select, Button, Badge, Switch } from "../../components/admin/ui.jsx";

export default function AdminQuizzes() {
  const [modules, setModules] = useState([]);
  const [moduleId, setModuleId] = useState("");
  const [quizzes, setQuizzes] = useState([]);

  const [form, setForm] = useState({
    title: "",
    description: "",
    durationSeconds: 600,
    isPublished: false,
  });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    api.get("/admin/modules").then(({ data }) => setModules(data.modules || []));
  }, []);
  useEffect(() => {
    if (moduleId) api.get(`/admin/quizzes/${moduleId}`).then(({ data }) => setQuizzes(data.quizzes || []));
    else setQuizzes([]);
  }, [moduleId]);

  const createQuiz = async (e) => {
    e.preventDefault();
    setBusy(true); setMsg("");
    try {
      await api.post("/admin/quizzes", { ...form, moduleId });
      setForm({ title:"", description:"", durationSeconds:600, isPublished:false });
      setMsg("Quiz created");
      const { data } = await api.get(`/admin/quizzes/${moduleId}`);
      setQuizzes(data.quizzes || []);
    } catch (e) {
      setMsg(e.response?.data?.error || "Failed");
    } finally { setBusy(false); }
  };

  const togglePublish = async (q) => {
    await api.patch(`/admin/quiz/${q._id}`, { isPublished: !q.isPublished });
    const { data } = await api.get(`/admin/quizzes/${moduleId}`);
    setQuizzes(data.quizzes || []);
  };

  return (
    <div className="ad-dashboard">
      <h2>Manage Quizzes</h2>

      <Panel title="Select Module">
        <Field label="Module">
          <Select value={moduleId} onChange={(e)=>setModuleId(e.target.value)}>
            <option value="">-- Choose module --</option>
            {modules.map(m => <option key={m._id} value={m._id}>{m.title} ({m.code})</option>)}
          </Select>
        </Field>
      </Panel>

      {moduleId && (
        <div className="ad-grid-2">
          <Panel title="Create Quiz">
            <form onSubmit={createQuiz}>
              <Field label="Title"><Input value={form.title} onChange={(e)=>setForm({...form, title:e.target.value})} required /></Field>
              <Field label="Description"><Textarea value={form.description} onChange={(e)=>setForm({...form, description:e.target.value})} /></Field>
              <Field label="Duration (seconds)"><Input type="number" min={30} value={form.durationSeconds} onChange={(e)=>setForm({...form, durationSeconds:Number(e.target.value)})} /></Field>
              <Field label="Published"><Switch checked={form.isPublished} onChange={(v)=>setForm({...form, isPublished:v})} /></Field>
              <Button disabled={busy}>{busy ? "Saving..." : "Add Quiz"}</Button>
              {msg && <div style={{marginTop:8}}><Badge tone="success">{msg}</Badge></div>}
            </form>
          </Panel>

          <Panel title={`Quizzes (${quizzes.length})`}>
            <table className="ad-table">
              <thead>
                <tr><th className="ad-th">Title</th><th className="ad-th">Duration</th><th className="ad-th">Status</th><th className="ad-th">Actions</th></tr>
              </thead>
              <tbody>
                {quizzes.map(q => (
                  <tr key={q._id} className="ad-tr ad-row">
                    <td className="ad-td"><strong>{q.title}</strong><div className="ad-field-hint">{q.description}</div></td>
                    <td className="ad-td">{q.durationSeconds}s</td>
                    <td className="ad-td">{q.isPublished ? <Badge tone="success">Published</Badge> : <Badge warn="true">Draft</Badge>}</td>
                    <td className="ad-td ad-actions">
                      <Switch checked={q.isPublished} onChange={()=>togglePublish(q)} />
                      {/* place for Edit/Delete later */}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>
        </div>
      )}
    </div>
  );
}
