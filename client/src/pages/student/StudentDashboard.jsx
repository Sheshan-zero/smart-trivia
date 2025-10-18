import { useEffect, useMemo, useState } from "react";
import { api } from "../../api/http";
import { useNavigate } from "react-router-dom";

// a few pleasant placeholders
const covers = [
  "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1500&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1499771931079-ce2182f1a5f0?q=80&w=1500&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?q=80&w=1500&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1529070538774-1843cb3265df?q=80&w=1500&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1500534314211-59a4872f73df?q=80&w=1500&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1520975916090-3105956dac38?q=80&w=1500&auto=format&fit=crop"
];

export default function StudentDashboard() {
  const nav = useNavigate();
  const [loading, setLoading] = useState(true);
  const [modules, setModules] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data: md } = await api.get("/public/modules");
        if (!mounted) return;
        setModules(md.modules || []);
        // fetch quizzes for all modules in parallel
        const promises = (md.modules || []).map(m =>
          api.get(`/public/modules/${m._id}/quizzes`).then(({ data }) =>
            (data.quizzes || []).map(q => ({ ...q, module: m }))
          )
        );
        const groups = await Promise.all(promises);
        const flat = groups.flat().sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
        setQuizzes(flat);
      } catch (e) {
        console.error(e);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return quizzes;
    return quizzes.filter(x =>
      x.title.toLowerCase().includes(q) ||
      (x.description || "").toLowerCase().includes(q) ||
      (x.module?.title || "").toLowerCase().includes(q) ||
      (x.module?.code || "").toLowerCase().includes(q)
    );
  }, [quizzes, query]);

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
        <h2 className="st-h2">Recent Quizzes</h2>
        {/* connect the top search input to this if you want shared state */}
        <input
          value={query}
          onChange={(e)=>setQuery(e.target.value)}
          placeholder="Search quizzes…"
          className="st-panel"
          style={{ width: 260, borderRadius: 9999, border: "1px solid var(--s-line)" }}
        />
      </div>

      {loading ? (
        <div className="st-panel">Loading quizzes…</div>
      ) : (
        <div className="st-grid">
          {filtered.map((q, i) => (
            <article key={q._id} className="qcard">
              <div className="qcover">
                <img src={covers[i % covers.length]} alt="" />
              </div>
              <div className="qbody">
                <div className="qmeta">
                  <span className="qtag">{q.module?.title || "Module"}</span>
                  <span className="badge gray">{Math.round((q.durationSeconds||0)/60)} min</span>
                  <span className={`badge ${q.isPublished ? "green" : "red"}`}>{q.isPublished ? "Active" : "Draft"}</span>
                </div>
                <div className="qtitle">{q.title}</div>
                <div className="qdesc">{q.description || "Test your knowledge with a set of questions."}</div>
              </div>
              <div className="qfoot">
                <div className="qbadges"></div>
                <button className="qbtn" onClick={() => nav(`/play/${q._id}`)}>Start Quiz</button>
              </div>
            </article>
          ))}

          {!filtered.length && (
            <div className="st-panel">No quizzes match your search.</div>
          )}
        </div>
      )}
    </div>
  );
}
