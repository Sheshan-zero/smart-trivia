import { useEffect, useMemo, useState } from "react";
import { api } from "../../api/http";
import { useNavigate } from "react-router-dom";

export default function MyResults() {
  const nav = useNavigate();
  const [loading, setLoading] = useState(true);
  const [attempts, setAttempts] = useState([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all"); // all | submitted | expired

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data } = await api.get("/attempts/mine?limit=200");
        if (mounted) setAttempts(data.attempts || []);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return attempts.filter(a => {
      const passStatus = status === "all" ? true : a.status === status;
      const text =
        (a.quiz?.title || "") +
        " " +
        (a.module?.title || "") +
        " " +
        (a.module?.code || "");
      const passQuery = !q || text.toLowerCase().includes(q);
      return passStatus && passQuery;
    });
  }, [attempts, query, status]);

  const badge = (tone, text) => (
    <span className={`badge ${tone}`} style={{ marginLeft: 6 }}>{text}</span>
  );

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
        <h2 className="st-h2">My Results</h2>
        <div style={{ display:"flex", gap:10 }}>
          <select
            value={status}
            onChange={(e)=>setStatus(e.target.value)}
            className="st-panel"
            style={{ borderRadius: 10, border: "1px solid var(--s-line)" }}
          >
            <option value="all">All</option>
            <option value="submitted">Submitted</option>
            <option value="expired">Expired</option>
          </select>
          <input
            value={query}
            onChange={(e)=>setQuery(e.target.value)}
            placeholder="Search results…"
            className="st-panel"
            style={{ width: 260, borderRadius: 9999, border: "1px solid var(--s-line)" }}
          />
        </div>
      </div>

      {loading ? (
        <div className="st-panel">Loading results…</div>
      ) : filtered.length ? (
        <div className="st-panel" style={{ padding: 0, overflow: "hidden" }}>
          <table className="ad-table" style={{ width: "100%", borderSpacing: 0 }}>
            <thead>
              <tr style={{ background:"#f8fafc" }}>
                <th className="ad-th">Module</th>
                <th className="ad-th">Quiz</th>
                <th className="ad-th">Score</th>
                <th className="ad-th">Duration</th>
                <th className="ad-th">Submitted</th>
                <th className="ad-th">Status</th>
                <th className="ad-th">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(a => (
                <tr key={a.id} className="ad-tr ad-row">
                  <td className="ad-td">
                    <div><strong>{a.module?.title || "—"}</strong></div>
                    <div className="ad-field-hint">{a.module?.code}</div>
                  </td>
                  <td className="ad-td">
                    <div><strong>{a.quiz?.title}</strong></div>
                  </td>
                  <td className="ad-td">{a.status === "submitted" ? a.score : "—"}</td>
                  <td className="ad-td">{a.durationSeconds ? `${Math.round(a.durationSeconds/60)} min` : "—"}</td>
                  <td className="ad-td">
                    {a.submittedAt ? new Date(a.submittedAt).toLocaleString() : "—"}
                  </td>
                  <td className="ad-td">
                    {a.status === "submitted" && badge("green", "Submitted")}
                    {a.status === "expired" && badge("red", "Expired")}
                    {a.status === "started" && badge("gray", "In progress")}
                  </td>
                  <td className="ad-td">
                    {a.status === "submitted" ? (
                      <button
                        className="st-logout"
                        onClick={() => nav(`/result/${a.id}`)}
                      >
                        View Result
                      </button>
                    ) : a.status === "started" ? (
                      <button
                        className="st-logout"
                        onClick={() => nav(`/play/${a.quiz.id}`)}
                      >
                        Resume
                      </button>
                    ) : (
                      <span style={{ color: "var(--s-muted)" }}>—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="st-panel">No attempts yet.</div>
      )}
    </div>
  );
}
