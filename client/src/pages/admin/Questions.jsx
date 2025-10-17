import { useEffect, useState } from "react";
import { api } from "../../api/http";
import { Panel, Field, Input, Textarea, Select, Button, Badge, Switch } from "../../components/admin/ui.jsx";

const DEFAULT_OPTIONS = [
  { key:"A", text:"" }, { key:"B", text:"" }, { key:"C", text:"" }, { key:"D", text:"" },
];

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
    options: DEFAULT_OPTIONS,
    correctKeys: [],
  });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

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

  // Auto-configure options for true/false
  useEffect(() => {
    if (form.type === "truefalse") {
      setForm(f => ({ ...f, options: [{key:"A", text:"True"}, {key:"B", text:"False"}], correctKeys: [] }));
    } else if (form.options.length < 3) {
      setForm(f => ({ ...f, options: DEFAULT_OPTIONS, correctKeys: [] }));
    }
  }, [form.type]);

  const updateOption = (i, text) => {
    const copy = [...form.options]; copy[i].text = text;
    setForm({ ...form, options: copy });
  };

  const toggleCorrect = (key) => {
    const set = new Set(form.correctKeys);
    set.has(key) ? set.delete(key) : set.add(key);
    if (form.type !== "multi" && set.size > 1) {
      // single-answer types should only keep one
      set.clear(); set.add(key);
    }
    setForm({ ...form, correctKeys: [...set] });
  };

  const addQuestion = async (e) => {
    e.preventDefault();
    setBusy(true); setMsg("");
    try {
      await api.post("/admin/questions", { ...form, quizId });
      setForm({ type:"mcq", text:"", marks:1, options:DEFAULT_OPTIONS, correctKeys:[] });
      const { data } = await api.get(`/admin/questions/${quizId}`);
      setQuestions(data.questions || []);
      setMsg("Question added");
    } catch (e) {
      setMsg(e.response?.data?.error || "Failed");
    } finally { setBusy(false); }
  };

  return (
    <div className="ad-dashboard">
      <h2>Manage Questions</h2>

      <div className="ad-grid-3">
        <Panel title="Pick Module">
          <Field label="Module">
            <Select value={moduleId} onChange={(e)=>setModuleId(e.target.value)}>
              <option value="">-- Select --</option>
              {modules.map(m => <option key={m._id} value={m._id}>{m.title}</option>)}
            </Select>
          </Field>
        </Panel>

        <Panel title="Pick Quiz">
          <Field label="Quiz">
            <Select value={quizId} onChange={(e)=>setQuizId(e.target.value)}>
              <option value="">-- Select --</option>
              {quizzes.map(q => <option key={q._id} value={q._id}>{q.title}</option>)}
            </Select>
          </Field>
        </Panel>

        <Panel title="Question Type">
          <Field label="Type">
            <Select value={form.type} onChange={(e)=>setForm({...form, type:e.target.value, correctKeys:[]})}>
              <option value="mcq">Single choice (MCQ)</option>
              <option value="multi">Multiple correct</option>
              <option value="truefalse">True / False</option>
            </Select>
          </Field>
        </Panel>
      </div>

      {quizId && (
        <div className="ad-grid-2" style={{marginTop:16}}>
          <Panel title="Create Question">
            <form onSubmit={addQuestion}>
              <Field label="Question text">
                <Textarea value={form.text} onChange={(e)=>setForm({...form, text:e.target.value})} required />
              </Field>

              <Field label="Marks">
                <Input type="number" min={1} value={form.marks} onChange={(e)=>setForm({...form, marks:Number(e.target.value)})} />
              </Field>

              {form.options.map((o, i) => (
                <div key={o.key} className="ad-grid-2" style={{alignItems:"center"}}>
                  <Field label={`Option ${o.key}`}>
                    <Input value={o.text} onChange={(e)=>updateOption(i, e.target.value)} disabled={form.type==="truefalse"} />
                  </Field>
                  <Field label="Correct?">
                    <label style={{ display:"flex", gap:8, alignItems:"center" }}>
                      <input
                        type="checkbox"
                        checked={form.correctKeys.includes(o.key)}
                        onChange={()=>toggleCorrect(o.key)}
                      />
                      <span>Mark as correct</span>
                    </label>
                  </Field>
                </div>
              ))}

              <Button disabled={busy}>{busy ? "Saving..." : "Add Question"}</Button>
              {msg && <div style={{marginTop:8}}><Badge tone="success">{msg}</Badge></div>}
            </form>
          </Panel>

          <Panel title={`Questions (${questions.length})`}>
            <ol style={{ margin:0, paddingLeft:18 }}>
              {questions.map(q => (
                <li key={q._id} style={{ marginBottom:12 }}>
                  <div style={{ fontWeight:600 }}>{q.text}</div>
                  <div style={{ margin:"6px 0" }}>
                    <Badge tone="muted">{q.type}</Badge> <Badge tone="muted">{q.marks} mark(s)</Badge>
                  </div>
                  <ul style={{ margin:"6px 0 0 16px" }}>
                    {q.options.map(o => (
                      <li key={o.key}>
                        <strong>{o.key}.</strong> {o.text}{" "}
                        {q.correctKeys?.includes(o.key) && <Badge tone="success">Correct</Badge>}
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ol>
          </Panel>
        </div>
      )}
    </div>
  );
}
