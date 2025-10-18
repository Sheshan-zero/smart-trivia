import { useEffect, useState } from "react";
import { api } from "../api/http";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const [modules, setModules] = useState([]);
  const [moduleId, setModuleId] = useState("");
  const [quizzes, setQuizzes] = useState([]);
  const nav = useNavigate();

  useEffect(() => {
    api.get("/public/modules").then(({ data }) => setModules(data.modules || []));
  }, []);

  useEffect(() => {
    setQuizzes([]);
    if (moduleId) api.get(`/public/modules/${moduleId}/quizzes`).then(({ data }) => setQuizzes(data.quizzes || []));
  }, [moduleId]);

  return (
    <div style={{ maxWidth: 860, margin: "40px auto" }}>
      <h1>Dashboard</h1>
      <label>Choose a Module</label>
      <select value={moduleId} onChange={(e)=>setModuleId(e.target.value)}>
        <option value="">-- Select --</option>
        {modules.map(m => <option key={m._id} value={m._id}>{m.title} ({m.code})</option>)}
      </select>

      {!!quizzes.length && (
        <>
          <h3 style={{ marginTop: 16 }}>Quizzes</h3>
          <ul>
            {quizzes.map(q => (
              <li key={q._id} style={{ marginBottom: 8 }}>
                <strong>{q.title}</strong> — {q.durationSeconds}s
                <button style={{ marginLeft: 10 }} onClick={() => nav(`/play/${q._id}`)}>Start</button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
