import { useEffect, useState } from "react";
import { api } from "../api/http";

export default function Dashboard() {
  const [modules, setModules] = useState([]);
  const [moduleId, setModuleId] = useState("");
  const [quizzes, setQuizzes] = useState([]);

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
              <li key={q._id}>
                <strong>{q.title}</strong> — {q.durationSeconds}s
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
