import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../store/auth";

export default function AdminLayout() {
  const { user, clearSession } = useAuth();
  const navigate = useNavigate();

  const logout = () => {
    clearSession();
    navigate("/login");
  };

  return (
    <div className="ad-shell">
      <aside className="ad-sidebar">
        <div className="ad-brand">
          <div className="ad-logo">🧠</div>
          <div className="ad-title">SMART-TRIVIA</div>
        </div>

        <nav className="ad-nav">
          <NavLink to="/admin/dashboard" className={({isActive}) => "ad-link" + (isActive ? " active" : "")}>
            <span>🏠</span> Dashboard
          </NavLink>
          <NavLink to="/admin/modules" className={({isActive}) => "ad-link" + (isActive ? " active" : "")}>
            <span>📚</span> Manage Modules
          </NavLink>
          <NavLink to="/admin/quizzes" className={({isActive}) => "ad-link" + (isActive ? " active" : "")}>
            <span>📝</span> Manage Quizzes
          </NavLink>
          <NavLink to="/admin/questions" className={({isActive}) => "ad-link" + (isActive ? " active" : "")}>
            <span>❓</span> Manage Questions
          </NavLink>
          <NavLink to="/admin/users" className={({isActive}) => "ad-link" + (isActive ? " active" : "")}>
            <span>👥</span> Manage Users
          </NavLink>
        </nav>

        <div className="ad-footer">© {new Date().getFullYear()} ALL RIGHTS RESERVED</div>
      </aside>

      <main className="ad-main">
        <header className="ad-topbar">
          <div />
          <div className="ad-user">
            <span className="ad-user-name">{user?.name || "Admin"}</span>
            <button className="ad-logout" onClick={logout}>Logout</button>
          </div>
        </header>

        <section className="ad-content">
          <Outlet />
        </section>
      </main>
    </div>
  );
}
