import { useEffect, useMemo, useState } from "react";
import { api } from "../../api/http";

const LIMIT = 12;

export default function AdminUsers() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const [q, setQ] = useState("");
  const [role, setRole] = useState("all");     
  const [status, setStatus] = useState("all");  

  const pages = Math.max(1, Math.ceil(total / LIMIT));

  const fetchUsers = async (p = page) => {
    setLoading(true);
    try {
      const { data } = await api.get("/admin/users", {
        params: { query: q, role, status, page: p, limit: LIMIT },
      });
      setItems(data.items || []);
      setTotal(data.total || 0);
      setPage(data.page || 1);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(1); }, [q, role, status]); // refetch on filters

  const toggleAdmin = async (u) => {
    const next = !u.isAdmin;
    await api.patch(`/admin/users/${u._id}`, { isAdmin: next });
    setItems(prev => prev.map(x => x._id === u._id ? { ...x, isAdmin: next } : x));
  };

  const toggleSuspended = async (u) => {
    const next = !u.isSuspended;
    await api.patch(`/admin/users/${u._id}`, { isSuspended: next });
    setItems(prev => prev.map(x => x._id === u._id ? { ...x, isSuspended: next } : x));
  };

  const resetPassword = async (u) => {
    await api.post(`/admin/users/${u._id}/reset-password`);
    alert(`Reset OTP sent to ${u.email}`);
  };

  const remove = async (u) => {
    if (!confirm(`Delete ${u.email}? This cannot be undone.`)) return;
    await api.delete(`/admin/users/${u._id}`);
    fetchUsers();
  };

  const invite = async () => {
    const email = prompt("Invite user email:");
    if (!email) return;
    const name = prompt("Name (optional):") || "";
    const isAdmin = confirm("Make this user an admin?");
    await api.post("/admin/users/invite", { email, name, isAdmin });
    alert("Invitation sent (OTP emailed).");
    fetchUsers();
  };

  const header = (
    <div className="ad-panel-title">
      <span>Manage Users</span>
      <span style={{ display:"flex", gap:8 }}>
        <input
          placeholder="Search name or email…"
          value={q}
          onChange={(e)=>setQ(e.target.value)}
          className="ad-input"
          style={{ width: 220 }}
        />
        <select value={role} onChange={e=>setRole(e.target.value)} className="ad-input">
          <option value="all">All roles</option>
          <option value="admin">Admins</option>
          <option value="student">Students</option>
        </select>
        <select value={status} onChange={e=>setStatus(e.target.value)} className="ad-input">
          <option value="all">All status</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
        </select>
        <button className="ad-btn primary" onClick={invite}>+ Invite</button>
      </span>
    </div>
  );

  return (
    <div className="ad-panel">
      {header}
      <div className="ad-panel-body" style={{ padding:0 }}>
        {loading ? (
          <div style={{ padding:14 }}>Loading…</div>
        ) : (
          <>
            <table className="ad-table" style={{ width:"100%", borderSpacing:0 }}>
              <thead>
                <tr>
                  <th className="ad-th">User</th>
                  <th className="ad-th">Role</th>
                  <th className="ad-th">Status</th>
                  <th className="ad-th">Created</th>
                  <th className="ad-th">Last login</th>
                  <th className="ad-th">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map(u => (
                  <tr key={u._id} className="ad-tr ad-row">
                    <td className="ad-td">
                      <div><strong>{u.name || "—"}</strong></div>
                      <div className="ad-field-hint">{u.email}</div>
                    </td>
                    <td className="ad-td">
                      {u.isAdmin ? <span className="badge green">Admin</span> : <span className="badge gray">Student</span>}
                    </td>
                    <td className="ad-td">
                      {u.isSuspended ? <span className="badge red">Suspended</span> : <span className="badge green">Active</span>}
                    </td>
                    <td className="ad-td">{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td className="ad-td">{u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : "—"}</td>
                    <td className="ad-td" style={{ display:"flex", gap:6 }}>
                      <button className="ad-btn" onClick={()=>toggleAdmin(u)}>
                        {u.isAdmin ? "Remove admin" : "Make admin"}
                      </button>
                      <button className="ad-btn" onClick={()=>toggleSuspended(u)}>
                        {u.isSuspended ? "Activate" : "Suspend"}
                      </button>
                      <button className="ad-btn" onClick={()=>resetPassword(u)}>Reset password</button>
                      <button className="ad-btn danger" onClick={()=>remove(u)}>Delete</button>
                    </td>
                  </tr>
                ))}
                {!items.length && (
                  <tr><td className="ad-td" colSpan="6" style={{ textAlign:"center", padding:18 }}>No users</td></tr>
                )}
              </tbody>
            </table>

            <div style={{ display:"flex", justifyContent:"flex-end", gap:8, padding:"12px 14px" }}>
              <button className="ad-btn" onClick={()=>{ if(page>1) fetchUsers(page-1); }} disabled={page<=1}>Prev</button>
              <div style={{ alignSelf:"center" }}>Page {page} / {pages}</div>
              <button className="ad-btn primary" onClick={()=>{ if(page<pages) fetchUsers(page+1); }} disabled={page>=pages}>Next</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
