import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../store/auth";

export default function StudentLayout() {
  const { user, clearSession } = useAuth();
  const nav = useNavigate();
  const logout = () => { clearSession(); nav("/login"); };

  return (
    <div className="st-shell">
      <aside className="st-sidebar">
        <div className="st-brand">
          <div className="st-logo">🧠</div>
          <div className="st-title">SMART-TRIVIA</div>
        </div>
        <nav className="st-nav">
          <NavLink to="/dashboard" className={({isActive}) => "st-link" + (isActive ? " active" : "")}>
            <span>🏠</span> Dashboard
          </NavLink>
          <NavLink to="/available" className={({isActive}) => "st-link" + (isActive ? " active" : "")}>
            <span>📝</span> Available Quizzes
          </NavLink>
          <NavLink to="/results" className={({isActive}) => "st-link" + (isActive ? " active" : "")}>
            <span>📊</span> My Results
          </NavLink>
        </nav>
        <div className="st-footer">© {new Date().getFullYear()} ALL RIGHTS RESERVED</div>
      </aside>

      <main className="st-main">
        <header className="st-topbar">
          <div className="st-search">
            <span>🔎</span>
            <input placeholder="Search a course…" />
          </div>
          <div className="st-user">
            <span>{user?.name || user?.email}</span>
            <button className="st-logout" onClick={logout}>Logout</button>
          </div>
        </header>
        <section className="st-content">
          <Outlet />
        </section>
      </main>
    </div>
  );
}
