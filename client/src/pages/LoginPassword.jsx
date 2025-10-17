import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/http";
import { useAuth } from "../store/auth";

export default function LoginPassword() {
  const setSession = useAuth((s) => s.setSession);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const navigate = useNavigate();   // ✅ Add this line

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setMsg("");
    try {
      const { data } = await api.post("/auth/login-password", { email, password });
      setSession({ accessToken: data.accessToken, user: data.user });
      navigate(data.user.role === "admin" ? "/admin/dashboard" : "/dashboard", { replace: true });
    } catch (e) {
      setMsg(e.response?.data?.error || "Login failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="login-form" onSubmit={submit}>
      <div className="input-wrap">
        <span className="input-icon">📧</span>
        <input
          type="email"
          placeholder="Email id"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>

      <div className="input-wrap">
        <span className="input-icon">🔒</span>
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>

      <button className="btn-primary" disabled={busy}>
        {busy ? "Signing in..." : "Login"}
      </button>

      {msg && <div className="notice">{msg}</div>}
    </form>
  );
}
