import { useEffect, useState } from "react";
import { api } from "../../api/http";
import { Panel, Field, Input, Textarea, Select, Button, Badge, Switch } from "../../components/admin/ui.jsx";

export default function AdminModules() {
  const [modules, setModules] = useState([]);
  const [form, setForm] = useState({ title: "", code: "", description: "" });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

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

  return (
    <div className="ad-dashboard">
      <h2>Manage Modules</h2>

      <div className="ad-grid-2">
        <Panel title="Create Module">
          <form onSubmit={createModule}>
            <Field label="Title">
              <Input value={form.title} onChange={(e)=>setForm({...form, title:e.target.value})} required />
            </Field>
            <Field label="Code" hint="e.g., CS101">
              <Input value={form.code} onChange={(e)=>setForm({...form, code:e.target.value})} required />
            </Field>
            <Field label="Description">
              <Textarea value={form.description} onChange={(e)=>setForm({...form, description:e.target.value})} />
            </Field>
            <Button disabled={busy}>{busy ? "Saving..." : "Add Module"}</Button>
            {msg && <div style={{marginTop:8}}><Badge tone="success">{msg}</Badge></div>}
          </form>
        </Panel>

        <Panel title={`Modules (${modules.length})`}>
          <table className="ad-table">
            <thead>
              <tr className="ad-th">
                <th className="ad-th">Title</th>
                <th className="ad-th">Code</th>
                <th className="ad-th">Status</th>
                <th className="ad-th">Actions</th>
              </tr>
            </thead>
            <tbody>
              {modules.map((m) => (
                <tr key={m._id} className="ad-tr ad-row">
                  <td className="ad-td"><strong>{m.title}</strong></td>
                  <td className="ad-td">{m.code}</td>
                  <td className="ad-td">{m.isActive ? <Badge tone="success">Active</Badge> : <Badge>Disabled</Badge>}</td>
                  <td className="ad-td ad-actions">
                    <Switch checked={m.isActive} onChange={() => toggleActive(m)} />
                    {/* placeholder for future edit/delete */}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      </div>
    </div>
  );
}
