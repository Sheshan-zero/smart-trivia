import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../api/http";

export default function QuizPlayer() {
  const { quizId } = useParams();
  const nav = useNavigate();

  const [questions, setQuestions] = useState([]);
  const [attemptId, setAttemptId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const timerRef = useRef(null);
  const [remaining, setRemaining] = useState(0); 

  const [answers, setAnswers] = useState({});

  const [idx, setIdx] = useState(0);

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

        const { data: ad } = await api.get(`/attempts/${sd.attemptId}`);
        const map = {};
        for (const r of ad.attempt.responses || []) map[r.questionId] = r.chosenKeys || [];
        setAnswers(map);

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

  useEffect(() => {
    if (!attemptId) return;
    const h = setInterval(() => {
      const responses = Object.entries(answers).map(([questionId, chosenKeys]) => ({ questionId, chosenKeys }));
      api.post(`/attempts/${attemptId}/save`, { responses }).catch(() => {});
    }, 8000);
    return () => clearInterval(h);
  }, [attemptId, answers]);

  const formatted = useMemo(() => {
    const m = Math.floor(remaining / 60).toString().padStart(2, "0");
    const s = (remaining % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  }, [remaining]);

  const nowOver = remaining <= 0;
  const total = questions.length;
  const q = questions[idx];
  const chosen = new Set(answers[q?._id] || []);
  const percent = total ? Math.round(((idx + 1) / total) * 100) : 0;

  const selectKey = (key) => {
    if (!q || nowOver) return;
    setAnswers(prev => {
      const cur = prev[q._id] || [];
      if (q.type === "multi") {
        const s = new Set(cur);
        s.has(key) ? s.delete(key) : s.add(key);
        return { ...prev, [q._id]: [...s] };
      }
      return { ...prev, [q._id]: [key] };
    });
  };

  const goPrev = () => setIdx(i => Math.max(0, i - 1));
  const goNext = () => setIdx(i => Math.min(total - 1, i + 1));

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

  if (loading || !q) return <div style={{ padding: 24 }}>Loading quiz…</div>;

  const last = idx === total - 1;
  const canNext = q.type === "multi" ? chosen.size > 0 : chosen.size === 1;

  return (
    <div className="qp-wrap">
      <div className="qp-card">
        <div className="qp-head">
          <div className="qp-progress">
            <div className="qp-progress-top">
              <span>Question {idx + 1}/{total}</span>
            </div>
            <div className="qp-bar">
              <div className="qp-bar-fill" style={{ width: `${percent}%` }} />
            </div>
          </div>

          <div className="qp-timer">
            <span>⏱</span>
            <strong>{nowOver ? "00:00" : formatted}</strong>
          </div>
        </div>

        <h2 className="qp-title">{q.text}</h2>

        <div className="qp-options">
          {q.options.map((o) => {
            const active = chosen.has(o.key);
            return (
              <button
                key={o.key}
                type="button"
                className={`qp-option ${active ? "active" : ""}`}
                onClick={() => selectKey(o.key)}
                disabled={nowOver}
              >
                <span className="qp-bullet">{o.key}</span>
                <span className="qp-text">{o.text}</span>
              </button>
            );
          })}
        </div>

        <div className="qp-nav">
          <button className="qp-btn ghost" onClick={goPrev} disabled={idx === 0}>← Previous</button>
          {!last ? (
            <button className="qp-btn primary" onClick={goNext} disabled={!canNext || nowOver}>Next →</button>
          ) : (
            <button className="qp-btn primary" onClick={submit} disabled={!canNext || submitting || nowOver}>
              {submitting ? "Submitting…" : "Submit"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
