import { useEffect, useState } from "react";
import { api } from "../../api/http";

export default function AdminModules() {
  const [list, setList] = useState([]);
  const [form, setForm] = useState({ title: "", code: "", description: "" });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const load = async () => {
    const { data } = await api.get("/admin/modules");
    setList(data.modules || []);
  };

  useEffect(() => { load(); }, []);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setMsg("");
    try {
      await api.post("/admin/modules", form);
      setForm({ title: "", code: "", description: "" });
      await load();
      setMsg("Module created");
    } catch (e) {
      setMsg(e.response?.data?.error || "Failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ maxWidth: 960, margin: "30px auto" }}>
      <h2>Modules</h2>
      <form onSubmit={submit} style={{ display: "grid", gap: 8, maxWidth: 520 }}>
        <input placeholder="Title" value={form.title} onChange={(e)=>setForm({...form, title:e.target.value})} required />
        <input placeholder="Code (e.g., CS101)" value={form.code} onChange={(e)=>setForm({...form, code:e.target.value})} required />
        <textarea placeholder="Description" value={form.description} onChange={(e)=>setForm({...form, description:e.target.value})} />
        <button disabled={busy}>{busy ? "Saving..." : "Add Module"}</button>
        {msg && <small>{msg}</small>}
      </form>

      <hr style={{ margin: "20px 0" }} />

      <ul>
        {list.map(m => (
          <li key={m._id}><strong>{m.title}</strong> — {m.code}</li>
        ))}
      </ul>
    </div>
  );
}
