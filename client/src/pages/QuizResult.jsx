import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { api } from "../api/http";

function normalizeResult(d) {
  if (!d) return null;
  return { ...d, breakdown: d.breakdown || d.review || [] };
}

export default function QuizResult() {
  const { attemptId } = useParams();
  const nav = useNavigate();
  const navState = useLocation().state;

  const [result, setResult] = useState(normalizeResult(navState));
  const [attempt, setAttempt] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;

    (async () => {
      setLoading(true);
      try {
        // always fetch attempt meta (for quizId/date)
        const { data: ad } = await api.get(`/attempts/${attemptId}`);
        if (!mounted) return;
        setAttempt(ad.attempt);

        // try to fetch enriched result (has options); if it fails, keep current
        try {
          const { data } = await api.get(`/attempts/${attemptId}/result`);
          if (!mounted) return;
          setResult(normalizeResult(data));
        } catch {
          // ignore (e.g., if not submitted yet — unlikely here)
          if (!result) {
            // if nothing to show at all, bail out
            alert("Result unavailable");
            nav("/dashboard");
          }
        }
      } catch (e) {
        alert(e.response?.data?.error || "Result unavailable");
        nav("/dashboard");
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => { mounted = false; };
  }, [attemptId, nav]); // deliberate: don't depend on result/navState

  if (loading || !result) return <div style={{ padding: 24 }}>Loading result…</div>;

  const breakdown = result.breakdown || [];
  const total = breakdown.length;
  const correctCount = breakdown.filter(b => b?.correct).length;
  const incorrectCount = Math.max(0, total - correctCount);
  const pct = total ? Math.round((correctCount / total) * 100) : 0;

  const radius = 56;
  const circumference = 2 * Math.PI * radius;
  const dash = (pct / 100) * circumference;

  const when = attempt?.submittedAt ? new Date(attempt.submittedAt) : null;
  const retry = () => { if (attempt?.quizId) nav(`/play/${attempt.quizId}`); };

  return (
    <div className="rs-wrap">
      <div className="rs-hero">
        <div className="rs-title">Congratulations!</div>
        <div className="rs-score-big">
          <span>{correctCount}</span>/<span className="muted">{total}</span>
        </div>
        <div className="rs-sub">You’re a true trivia master!</div>
      </div>

      <div className="rs-grid">
        <section className="rs-card">
          <div className="rs-card-title">Quiz Summary</div>
          <ul className="rs-summary">
            <li><span>Quiz:</span><strong>General Knowledge Challenge</strong></li>
            <li><span>Category:</span><strong>General Knowledge</strong></li>
            <li><span>Difficulty:</span><strong>—</strong></li>
            <li><span>Date:</span><strong>{when ? when.toLocaleDateString() : "—"}</strong></li>
          </ul>
          <div className="rs-bands">
            <div className="rs-band good"><span>✅ Correct Answers</span><strong>{correctCount}</strong></div>
            <div className="rs-band bad"><span>❌ Incorrect Answers</span><strong>{incorrectCount}</strong></div>
          </div>
        </section>

        <section className="rs-card">
          <div className="rs-card-title">Performance Analysis</div>
          <div className="rs-donut-wrap">
            <svg viewBox="0 0 140 140" className="rs-donut">
              <circle className="bg" cx="70" cy="70" r={radius} strokeWidth="14" fill="none" />
              <circle
                className="fg"
                cx="70" cy="70" r={radius}
                strokeWidth="14" fill="none"
                strokeDasharray={`${dash} ${circumference - dash}`}
                strokeLinecap="round"
                transform="rotate(-90 70 70)"
              />
            </svg>
            <div className="rs-donut-label">
              <div className="rs-donut-pct">{pct}%</div>
              <div className="rs-donut-sub">Correct</div>
            </div>
          </div>
          <div className="rs-note">You outperformed many participants!</div>
        </section>
      </div>

      <div className="rs-actions">
        <button className="qp-btn primary" onClick={retry} disabled={!attempt?.quizId}>Retry Quiz</button>
        <button className="qp-btn ghost" onClick={() => nav("/dashboard")}>Back to Dashboard</button>
      </div>

      <details className="rs-details">
        <summary>Review answers</summary>
        <ol className="rs-review">
          {breakdown.map((b, i) => {
            const opts = b?.options || [];
            const chosen = new Set(b?.chosenKeys || []);
            const correct = new Set(b?.correctKeys || []);
            return (
              <li key={b?.questionId || i}>
                <div className="q">{i + 1}. {b?.text || "Question"}</div>
                {opts.length > 0 ? (
                  <ul>
                    {opts.map(o => {
                      const isChosen = chosen.has(o.key);
                      const isCorrect = correct.has(o.key);
                      return (
                        <li key={o.key} className={isCorrect ? "correct" : isChosen ? "chosen" : ""}>
                          <strong>{o.key}.</strong> {o.text}
                          {isChosen && " • your answer"}
                          {isCorrect && " • correct"}
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  // Fallback when we don't have option texts (coming from /submit payload)
                  <div style={{ color:"#6b7280", fontSize:14 }}>
                    Your answer: <strong>{[...chosen].join(", ") || "—"}</strong> &nbsp; | &nbsp;
                    Correct: <strong>{[...correct].join(", ") || "—"}</strong>
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      </details>
    </div>
  );
}
