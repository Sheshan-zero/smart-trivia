import { useEffect, useState } from "react";
import { api } from "../../api/http";
import { Panel, Field, Input, Textarea, Button, Badge, Switch } from "../../components/admin/ui.jsx";

export default function AdminModules() {
  const [modules, setModules] = useState([]);
  const [filter, setFilter] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const [form, setForm] = useState({ title: "", code: "", description: "" });


  const [editing, setEditing] = useState(null); 
  const [savingEdit, setSavingEdit] = useState(false);


  const [deletingId, setDeletingId] = useState(null);

  const load = async () => {
    const { data } = await api.get("/admin/modules");
    setModules(data.modules || []);
  };
  useEffect(() => { load(); }, []);

  const createModule = async (e) => {
    e.preventDefault();
    setBusy(true); setMsg("");
    try {
      await api.post("/admin/modules", form);
      setForm({ title:"", code:"", description:"" });
      setMsg("Module created");
      await load();
    } catch (e) {
      setMsg(e.response?.data?.error || "Failed");
    } finally { setBusy(false); }
  };

  const toggleActive = async (m) => {
    await api.patch(`/admin/modules/${m._id}`, { isActive: !m.isActive });
    await load();
  };

  const startEdit = (m) => {
    setEditing({
      _id: m._id,
      title: m.title || "",
      code: m.code || "",
      description: m.description || "",
      isActive: !!m.isActive,
    });
  };

  const saveEdit = async (e) => {
    e?.preventDefault?.();
    if (!editing?._id) return;
    setSavingEdit(true);
    try {
      const payload = {
        title: editing.title,
        code: editing.code,
        description: editing.description,
        isActive: editing.isActive,
      };
      await api.patch(`/admin/modules/${editing._id}`, payload);
      setEditing(null);
      await load();
    } catch (e) {
      alert(e.response?.data?.error || "Update failed");
    } finally {
      setSavingEdit(false);
    }
  };

  const deleteModule = async (m) => {
    if (!window.confirm(`Delete module "${m.title}"? This cannot be undone.`)) return;
    setDeletingId(m._id);
    try {
      await api.delete(`/admin/modules/${m._id}`);
      await load();
    } catch (e) {
      const err = e.response?.data?.error || "";
      if (err.toLowerCase().includes("module has quizzes")) {
        const sure = window.confirm(
          "This module has quizzes. Do you also want to delete ALL its quizzes and questions?"
        );
        if (sure) {
          try {
            await api.delete(`/admin/modules/${m._id}?force=true`);
            await load();
          } catch (e2) {
            alert(e2.response?.data?.error || "Force delete failed");
          }
        }
      } else {
        alert(err || "Delete failed");
      }
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = modules.filter(m => {
    const q = filter.trim().toLowerCase();
    if (!q) return true;
    return (m.title || "").toLowerCase().includes(q) || (m.code || "").toLowerCase().includes(q);
  });

  return (
    <div className="ad-dashboard">
      <h2>Manage Modules</h2>

      <div className="ad-grid-2">
        <Panel title="Create Module">
          <form onSubmit={createModule}>
            <Field label="Title">
              <Input
                value={form.title}
                onChange={(e)=>setForm({...form, title:e.target.value})}
                required
              />
            </Field>
            <Field label="Code" hint="e.g., CS101">
              <Input
                value={form.code}
                onChange={(e)=>setForm({...form, code:e.target.value})}
                required
              />
            </Field>
            <Field label="Description">
              <Textarea
                value={form.description}
                onChange={(e)=>setForm({...form, description:e.target.value})}
              />
            </Field>
            <Button disabled={busy}>{busy ? "Saving..." : "Add Module"}</Button>
            {msg && <div style={{marginTop:8}}><Badge tone="success">{msg}</Badge></div>}
          </form>
        </Panel>

        <Panel
          title={`Modules (${filtered.length}/${modules.length})`}
          right={
            <div style={{ display:"flex", gap:8, alignItems:"center" }}>
              <Input placeholder="Search…" value={filter} onChange={e=>setFilter(e.target.value)} />
              <Button variant="ghost" onClick={load}>Refresh</Button>
            </div>
          }
        >
          <table className="ad-table">
            <thead>
              <tr className="ad-th">
                <th className="ad-th">Title</th>
                <th className="ad-th">Code</th>
                <th className="ad-th">Status</th>
                <th className="ad-th" style={{ width: 220 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((m) => (
                <tr key={m._id} className="ad-tr ad-row">
                  <td className="ad-td"><strong>{m.title}</strong></td>
                  <td className="ad-td">{m.code}</td>
                  <td className="ad-td">
                    {m.isActive ? <Badge tone="success">Active</Badge> : <Badge>Disabled</Badge>}
                  </td>
                  <td className="ad-td ad-actions" style={{ display:"flex", gap:8 }}>
                    <Switch checked={m.isActive} onChange={() => toggleActive(m)} />
                    <Button variant="ghost" onClick={() => startEdit(m)}>Edit</Button>
                    <Button
                      variant="ghost"
                      style={{ color: "#b91c1c" }}
                      disabled={deletingId === m._id}
                      onClick={() => deleteModule(m)}
                    >
                      {deletingId === m._id ? "Deleting…" : "Delete"}
                    </Button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td className="ad-td" colSpan={4} style={{ textAlign:"center", padding:"16px 8px", color:"#6b7280" }}>
                    No modules match your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </Panel>
      </div>

      {editing && (
        <div
          style={{
            position:"fixed", inset:0, background:"rgba(0,0,0,0.35)",
            display:"flex", alignItems:"center", justifyContent:"center", zIndex:50
          }}
          onClick={() => !savingEdit && setEditing(null)}
        >
          <div
            className="ad-panel"
            style={{ width:520, maxWidth:"90%", background:"#fff" }}
            onClick={(e)=>e.stopPropagation()}
          >
            <div className="ad-panel-title">
              <span>Edit Module</span>
              <span>
                <Button variant="ghost" onClick={()=>!savingEdit && setEditing(null)}>Close</Button>
              </span>
            </div>
            <div className="ad-panel-body">
              <form onSubmit={saveEdit}>
                <Field label="Title">
                  <Input
                    value={editing.title}
                    onChange={e=>setEditing({...editing, title:e.target.value})}
                    required
                  />
                </Field>
                <Field label="Code">
                  <Input
                    value={editing.code}
                    onChange={e=>setEditing({...editing, code:e.target.value})}
                    required
                  />
                </Field>
                <Field label="Description">
                  <Textarea
                    value={editing.description}
                    onChange={e=>setEditing({...editing, description:e.target.value})}
                  />
                </Field>
                <Field label="Active">
                  <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                    <Switch
                      checked={!!editing.isActive}
                      onChange={() => setEditing({...editing, isActive: !editing.isActive})}
                    />
                    {editing.isActive ? <Badge tone="success">Active</Badge> : <Badge>Disabled</Badge>}
                  </div>
                </Field>
                <div style={{ display:"flex", gap:8, marginTop:12 }}>
                  <Button disabled={savingEdit} type="submit">
                    {savingEdit ? "Saving…" : "Save changes"}
                  </Button>
                  <Button variant="ghost" onClick={()=>!savingEdit && setEditing(null)}>Cancel</Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
