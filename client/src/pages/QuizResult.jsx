import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { api } from "../api/http";

export default function QuizResult() {
  const { attemptId } = useParams();
  const nav = useNavigate();
  const navState = useLocation().state; // may contain server response from submit
  const [result, setResult] = useState(navState || null);
  const [loading, setLoading] = useState(!navState);

  useEffect(() => {
    let mounted = true;
    if (!navState) {
      (async () => {
        try {
          const { data } = await api.get(`/attempts/${attemptId}/result`);
          if (mounted) setResult(data);
        } catch (e) {
          alert(e.response?.data?.error || "Result unavailable");
          nav("/dashboard");
        } finally {
          if (mounted) setLoading(false);
        }
      })();
    }
    return () => { mounted = false; };
  }, [attemptId, nav, navState]);

  if (loading || !result) return <div style={{ padding: 24 }}>Loading result…</div>;

  return (
    <div style={{ maxWidth: 900, margin: "24px auto" }}>
      <h2>Result</h2>
      <div style={{ margin: "10px 0" }}>
        <strong>Score:</strong> {result.score} &nbsp; | &nbsp;
        <strong>Time:</strong> {result.durationSeconds}s
      </div>

      <ol>
        {result.breakdown.map((b, i) => (
          <li key={b.questionId} style={{ marginBottom: 16 }}>
            <div style={{ fontWeight: 600 }}>
              Q{i+1}. {b.text} {b.correct ? <span style={{ color:"#15803d" }}>✓</span> : <span style={{ color:"#b91c1c" }}>✗</span>}
            </div>
            <ul style={{ listStyle: "none", paddingLeft: 0 }}>
              {b.options.map(o => {
                const isChosen = (b.chosenKeys || []).includes(o.key);
                const isCorrect = (b.correctKeys || []).includes(o.key);
                return (
                  <li key={o.key} style={{ marginTop: 6 }}>
                    <span style={{
                      padding: "2px 6px",
                      borderRadius: 8,
                      background: isCorrect ? "#e9f8ee" : "#f8fafc",
                      border: "1px solid #e5e7eb"
                    }}>
                      <strong>{o.key}.</strong> {o.text}
                      {isChosen && " • your answer"}
                      {isCorrect && " • correct"}
                    </span>
                  </li>
                );
              })}
            </ul>
          </li>
        ))}
      </ol>

      <button onClick={() => nav("/dashboard")} style={{ padding: "10px 14px" }}>Back to Dashboard</button>
    </div>
  );
}
