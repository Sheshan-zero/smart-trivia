import { useState } from "react";
import { api } from "../api/http";
import { useAuth } from "../store/auth";

function HeaderBrand() {
  return (
    <header className="brand">
      <div className="logo-dot">🧠</div>
      <span className="brand-text">SMART-TRIVIA</span>
    </header>
  );
}

export default function Signup() {
  const setSession = useAuth((s) => s.setSession);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "student" });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const update = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setMsg("");
    try {
      const { data } = await api.post("/auth/signup", form);
      setSession({ accessToken: data.accessToken, user: data.user });
      setMsg("Account created — you’re logged in!");
    } catch (e) {
      setMsg(e.response?.data?.error || "Signup failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="login-shell">
      <HeaderBrand />
      <div className="login-center">
        <div className="login-card">
          <h2 className="login-title">Create your account</h2>
          <p className="login-sub">Join Smart Trivia</p>

          <form className="login-form" onSubmit={submit}>
            <div className="input-wrap">
              <span className="input-icon">👤</span>
              <input
                type="text"
                placeholder="Full name"
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                required
              />
            </div>

            <div className="input-wrap">
              <span className="input-icon">📧</span>
              <input
                type="email"
                placeholder="Email id"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                required
              />
            </div>

            <div className="input-wrap">
              <span className="input-icon">🔒</span>
              <input
                type="password"
                placeholder="Password"
                value={form.password}
                onChange={(e) => update("password", e.target.value)}
                required
              />
            </div>

            <button className="btn-primary" disabled={busy}>
              {busy ? "Creating..." : "Sign up"}
            </button>

            <div className="row-between">
              <span className="muted">Already have an account? <a className="link-inline" href="/login">Login</a></span>
            </div>

            {msg && <div className="notice">{msg}</div>}
          </form>
        </div>
      </div>
    </div>
  );
}
