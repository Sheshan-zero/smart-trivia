import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../api/http";

export default function QuizPlayer() {
  const { quizId } = useParams();
  const nav = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [attemptId, setAttemptId] = useState(null);
  const [endsAt, setEndsAt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // responses state: { [questionId]: [keys] }
  const [answers, setAnswers] = useState({});
  const timerRef = useRef(null);
  const [remaining, setRemaining] = useState(0); // seconds

  // fetch questions (without answers) + start attempt
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data: qd } = await api.get(`/public/quizzes/${quizId}/questions`);
        if (!mounted) return;
        setQuestions(qd.questions || []);

        const { data: sd } = await api.post("/attempts/start", { quizId });
        if (!mounted) return;
        setAttemptId(sd.attemptId);
        setEndsAt(sd.endsAt);

        // resume answers if any
        const { data: ad } = await api.get(`/attempts/${sd.attemptId}`);
        const map = {};
        for (const r of ad.attempt.responses || []) map[r.questionId] = r.chosenKeys || [];
        setAnswers(map);

        // start countdown based on server endsAt
        const endMs = new Date(sd.endsAt).getTime();
        const tick = () => {
          const rem = Math.max(0, Math.floor((endMs - Date.now()) / 1000));
          setRemaining(rem);
          if (rem <= 0) clearInterval(timerRef.current);
        };
        tick();
        timerRef.current = setInterval(tick, 1000);
      } catch (e) {
        alert(e.response?.data?.error || "Failed to start quiz");
        nav("/dashboard");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; clearInterval(timerRef.current); };
  }, [quizId, nav]);

  const formatted = useMemo(() => {
    const m = Math.floor(remaining / 60).toString().padStart(2, "0");
    const s = (remaining % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  }, [remaining]);

  const toggle = (qid, key, multi) => {
    setAnswers(prev => {
      const cur = prev[qid] || [];
      if (multi) {
        const set = new Set(cur);
        set.has(key) ? set.delete(key) : set.add(key);
        return { ...prev, [qid]: [...set] };
      } else {
        // single choice
        return { ...prev, [qid]: [key] };
      }
    });
  };

  // autosave (optional) every 8s
  useEffect(() => {
    if (!attemptId) return;
    const h = setInterval(() => {
      const responses = Object.entries(answers).map(([questionId, chosenKeys]) => ({ questionId, chosenKeys }));
      api.post(`/attempts/${attemptId}/save`, { responses }).catch(() => {});
    }, 8000);
    return () => clearInterval(h);
  }, [attemptId, answers]);

  const submit = async () => {
    if (!attemptId) return;
    setSubmitting(true);
    try {
      const responses = Object.entries(answers).map(([questionId, chosenKeys]) => ({ questionId, chosenKeys }));
      const { data } = await api.post(`/attempts/${attemptId}/submit`, { responses });
      nav(`/result/${attemptId}`, { state: data });
    } catch (e) {
      alert(e.response?.data?.error || "Submit failed");
      if (e.response?.data?.error?.includes("expired")) nav(`/result/${attemptId}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div style={{ padding: 24 }}>Loading quiz…</div>;

  const nowOver = remaining <= 0;

  return (
    <div style={{ maxWidth: 900, margin: "24px auto" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <h2>Quiz</h2>
        <div style={{ fontSize: 18, fontWeight: 700 }}>{nowOver ? "00:00" : formatted}</div>
      </div>

      <ol>
        {questions.map(q => {
          const multi = q.type === "multi";
          const chosen = new Set(answers[q._id] || []);
          return (
            <li key={q._id} style={{ marginBottom: 16 }}>
              <div style={{ fontWeight: 600 }}>{q.text}</div>
              <ul style={{ listStyle: "none", paddingLeft: 0 }}>
                {q.options.map(o => {
                  const checked = chosen.has(o.key);
                  return (
                    <li key={o.key} style={{ marginTop: 6 }}>
                      <label style={{ display: "flex", gap: 8, alignItems:"center" }}>
                        <input
                          type={multi ? "checkbox" : "radio"}
                          name={q._id}
                          checked={checked}
                          onChange={() => toggle(q._id, o.key, multi)}
                          disabled={nowOver}
                        />
                        <span><strong>{o.key}.</strong> {o.text}</span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            </li>
          );
        })}
      </ol>

      <button onClick={submit} disabled={submitting || nowOver} style={{ padding: "10px 14px" }}>
        {submitting ? "Submitting…" : "Submit"}
      </button>
      {nowOver && <div style={{ marginTop: 10, color: "#b91c1c" }}>Time is up — try submitting to see result.</div>}
    </div>
  );
}
