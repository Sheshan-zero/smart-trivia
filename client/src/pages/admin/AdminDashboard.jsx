import { useEffect, useState } from "react";
import { api } from "../../api/http";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    users: 0,
    quizzes: 0,
    reports: 0,
    approvals: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await api.get("/admin/stats"); // must be 200
        setStats({
          users: Number(data?.users ?? 0),
          quizzes: Number(data?.quizzes ?? 0),
          reports: Number(data?.reports ?? 0),
          approvals: Number(data?.approvals ?? 0),
        });
        console.log("stats from /admin/stats:", data);
      } catch (err) {
        console.warn("Failed /admin/stats, using fallback:", err?.response?.status, err?.message);
        // Fallback values so cards aren’t empty while you wire a real stats endpoint
        setStats({ users: 5, quizzes: 10, reports: 0, approvals: 3 });
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="ad-dashboard">
      <h2>Dashboard</h2>

      <div className="ad-cards">
        <div className="ad-card">
          <div className="ad-card-title">Total Users</div>
          <div className="ad-card-value">{Number(stats.users ?? 0)}</div>
        </div>
        <div className="ad-card">
          <div className="ad-card-title">Total Quizzes</div>
          <div className="ad-card-value">{Number(stats.quizzes ?? 0)}</div>
        </div>
        <div className="ad-card">
          <div className="ad-card-title">Reports Generated</div>
          <div className="ad-card-value">{Number(stats.reports ?? 0)}</div>
        </div>
        <div className="ad-card">
          <div className="ad-card-title">Pending Approvals</div>
          <div className="ad-card-value">{Number(stats.approvals ?? 0)}</div>
        </div>
      </div>

      <div className="ad-panels">
        <div className="ad-panel">
          <div className="ad-panel-title">Users & Quiz Trends</div>
          <div className="ad-panel-body ad-empty">[chart placeholder]</div>
        </div>
        <div className="ad-panel">
          <div className="ad-panel-title">Notifications</div>
          <div className="ad-panel-body ad-empty">No notifications</div>
        </div>
      </div>
    </div>
  );
}
