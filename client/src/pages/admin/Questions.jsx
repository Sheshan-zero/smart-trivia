import { useEffect, useState } from "react";
import { api } from "../../api/http";

export default function AdminQuestions() {
  const [modules, setModules] = useState([]);
  const [moduleId, setModuleId] = useState("");
  const [quizzes, setQuizzes] = useState([]);
  const [quizId, setQuizId] = useState("");
  const [questions, setQuestions] = useState([]);

  const [form, setForm] = useState({
    type: "mcq",
    text: "",
    marks: 1,
    options: [
      { key: "A", text: "" },
      { key: "B", text: "" },
      { key: "C", text: "" },
      { key: "D", text: "" },
    ],
    correctKeys: [],
  });
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.get("/admin/modules").then(({ data }) => setModules(data.modules || []));
  }, []);

  useEffect(() => {
    setQuizzes([]); setQuizId(""); setQuestions([]);
    if (moduleId) api.get(`/admin/quizzes/${moduleId}`).then(({ data }) => setQuizzes(data.quizzes || []));
  }, [moduleId]);

  useEffect(() => {
    setQuestions([]);
    if (quizId) api.get(`/admin/questions/${quizId}`).then(({ data }) => setQuestions(data.questions || []));
  }, [quizId]);

  const updateOption = (i, text) => {
    const copy = [...form.options]; copy[i].text = text; setForm({ ...form, options: copy });
  };
  const toggleCorrect = (k) => {
    const set = new Set(form.correctKeys);
    set.has(k) ? set.delete(k) : set.add(k);
    setForm({ ...form, correctKeys: [...set] });
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!quizId) return setMsg("Select quiz first");
    setBusy(true); setMsg("");
    try {
      await api.post("/admin/questions", { ...form, quizId });
      setForm({ ...form, text: "", options: form.options.map(o => ({ ...o, text: "" })), correctKeys: [] });
      const { data } = await api.get(`/admin/questions/${quizId}`);
      setQuestions(data.questions || []);
      setMsg("Question added");
    } catch (e) {
      setMsg(e.response?.data?.error || "Failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ maxWidth: 960, margin: "30px auto" }}>
      <h2>Questions</h2>

      <div style={{ display: "grid", gap: 8, maxWidth: 720 }}>
        <div>
          <label>Module</label>
          <select value={moduleId} onChange={(e)=>setModuleId(e.target.value)}>
            <option value="">-- Select module --</option>
            {modules.map(m => <option key={m._id} value={m._id}>{m.title}</option>)}
          </select>
        </div>

        <div>
          <label>Quiz</label>
          <select value={quizId} onChange={(e)=>setQuizId(e.target.value)}>
            <option value="">-- Select quiz --</option>
            {quizzes.map(q => <option key={q._id} value={q._id}>{q.title}</option>)}
          </select>
        </div>
      </div>

      {quizId && (
        <>
          <form onSubmit={submit} style={{ display: "grid", gap: 8, maxWidth: 720, marginTop: 12 }}>
            <label>Type</label>
            <select value={form.type} onChange={(e)=>setForm({ ...form, type: e.target.value })}>
              <option value="mcq">Single choice (MCQ)</option>
              <option value="multi">Multiple correct</option>
              <option value="truefalse">True / False</option>
            </select>

            <input placeholder="Question text" value={form.text} onChange={(e)=>setForm({ ...form, text: e.target.value })} required />
            <input type="number" min={1} placeholder="Marks" value={form.marks} onChange={(e)=>setForm({ ...form, marks: Number(e.target.value) })} />

            {form.options.map((o, i) => (
              <div key={o.key} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <label style={{ width: 40 }}>{o.key}.</label>
                <input placeholder={`Option ${o.key}`} value={o.text} onChange={(e)=>updateOption(i, e.target.value)} />
                <label>
                  <input
                    type="checkbox"
                    checked={form.correctKeys.includes(o.key)}
                    onChange={()=>toggleCorrect(o.key)}
                  /> Correct
                </label>
              </div>
            ))}

            <button disabled={busy}>{busy ? "Saving..." : "Add Question"}</button>
            {msg && <small>{msg}</small>}
          </form>

          <hr style={{ margin: "20px 0" }} />

          <ol>
            {questions.map(q => (
              <li key={q._id}>
                <strong>{q.text}</strong> ({q.type}, {q.marks} marks)
              </li>
            ))}
          </ol>
        </>
      )}
    </div>
  );
}
