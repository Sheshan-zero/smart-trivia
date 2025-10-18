import { useEffect, useMemo, useState } from "react";
import { api } from "../../api/http";
import { useNavigate } from "react-router-dom";

// pleasant placeholder covers
const covers = [
  "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1500&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1499771931079-ce2182f1a5f0?q=80&w=1500&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?q=80&w=1500&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1529070538774-1843cb3265df?q=80&w=1500&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1500534314211-59a4872f73df?q=80&w=1500&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1520975916090-3105956dac38?q=80&w=1500&auto=format&fit=crop"
];

export default function AvailableQuizzes() {
  const nav = useNavigate();

  // modules view
  const [modules, setModules] = useState([]);
  const [loadingModules, setLoadingModules] = useState(true);
  const [moduleQuery, setModuleQuery] = useState("");

  // selected module → quizzes view
  const [selected, setSelected] = useState(null); // { _id, title, code, description }
  const [quizzes, setQuizzes] = useState([]);
  const [loadingQuizzes, setLoadingQuizzes] = useState(false);
  const [quizQuery, setQuizQuery] = useState("");

  // Load all modules initially
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data } = await api.get("/public/modules");
        if (mounted) setModules(data.modules || []);
      } finally {
        if (mounted) setLoadingModules(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // When a module is selected, pull quizzes
  const openModule = async (mod) => {
    setSelected(mod);
    setQuizzes([]);
    setQuizQuery("");
    setLoadingQuizzes(true);
    try {
      const { data } = await api.get(`/public/modules/${mod._id}/quizzes`);
      setQuizzes(data.quizzes || []);
    } finally {
      setLoadingQuizzes(false);
    }
  };

  const backToModules = () => {
    setSelected(null);
    setQuizzes([]);
  };

  // Filters
  const filteredModules = useMemo(() => {
    const q = moduleQuery.trim().toLowerCase();
    if (!q) return modules;
    return modules.filter(m =>
      m.title.toLowerCase().includes(q) ||
      (m.code || "").toLowerCase().includes(q) ||
      (m.description || "").toLowerCase().includes(q)
    );
  }, [modules, moduleQuery]);

  const filteredQuizzes = useMemo(() => {
    const q = quizQuery.trim().toLowerCase();
    if (!q) return quizzes;
    return quizzes.filter(x =>
      x.title.toLowerCase().includes(q) ||
      (x.description || "").toLowerCase().includes(q)
    );
  }, [quizzes, quizQuery]);

  // ---------- Renders ----------
  if (!selected) {
    // Modules grid
    return (
      <div>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
          <h2 className="st-h2">All Modules</h2>
          <input
            value={moduleQuery}
            onChange={(e)=>setModuleQuery(e.target.value)}
            placeholder="Search modules…"
            className="st-panel"
            style={{ width: 260, borderRadius: 9999, border: "1px solid var(--s-line)" }}
          />
        </div>

        {loadingModules ? (
          <div className="st-panel">Loading modules…</div>
        ) : filteredModules.length ? (
          <div className="st-grid">
            {filteredModules.map((m, i) => (
              <article key={m._id} className="qcard">
                <div className="qcover">
                  <img src={covers[i % covers.length]} alt="" />
                </div>
                <div className="qbody">
                  <div className="qmeta">
                    <span className="qtag">{m.code}</span>
                  </div>
                  <div className="qtitle">{m.title}</div>
                  <div className="qdesc">{m.description || "Explore quizzes for this module."}</div>
                </div>
                <div className="qfoot">
                  <button className="qbtn" onClick={() => openModule(m)}>View Quizzes</button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="st-panel">No modules match your search.</div>
        )}
      </div>
    );
  }

  // Quizzes in selected module
  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <button className="st-logout" onClick={backToModules}>← Back</button>
          <h2 className="st-h2" style={{ margin:0 }}>{selected.title}</h2>
          <span className="badge gray">{selected.code}</span>
        </div>
        <input
          value={quizQuery}
          onChange={(e)=>setQuizQuery(e.target.value)}
          placeholder="Search quizzes…"
          className="st-panel"
          style={{ width: 260, borderRadius: 9999, border: "1px solid var(--s-line)" }}
        />
      </div>

      {loadingQuizzes ? (
        <div className="st-panel">Loading quizzes…</div>
      ) : filteredQuizzes.length ? (
        <div className="st-grid">
          {filteredQuizzes.map((q, i) => (
            <article key={q._id} className="qcard">
              <div className="qcover">
                <img src={covers[i % covers.length]} alt="" />
              </div>
              <div className="qbody">
                <div className="qmeta">
                  <span className="qtag">{selected.title}</span>
                  <span className="badge gray">{Math.round((q.durationSeconds||0)/60)} min</span>
                  <span className={`badge ${q.isPublished ? "green" : "red"}`}>{q.isPublished ? "Active" : "Draft"}</span>
                </div>
                <div className="qtitle">{q.title}</div>
                <div className="qdesc">{q.description || "Test your knowledge with a set of questions."}</div>
              </div>
              <div className="qfoot">
                <button className="qbtn" onClick={() => nav(`/play/${q._id}`)}>Start Quiz</button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="st-panel">No quizzes found for this module.</div>
      )}
    </div>
  );
}
