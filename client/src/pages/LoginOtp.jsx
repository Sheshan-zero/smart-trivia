import { useState } from "react";
import { api } from "../api/http";
import { useAuth } from "../store/auth";

export default function LoginOtp({ email }) {
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const setSession = useAuth((s) => s.setSession);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setMsg("");
    try {
      const { data } = await api.post("/auth/verify-otp", { email, code, purpose: "login" });
      setSession({ accessToken: data.accessToken, user: data.user });
      setMsg("Logged in!");
    } catch (e) {
      setMsg(e.response?.data?.error || "Verification failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} style={{ display: "grid", gap: 12 }}>
      <h3>Enter the 6-digit OTP sent to {email}</h3>
      <input
        type="text"
        maxLength={6}
        placeholder="123456"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        required
      />
      <button disabled={busy}>{busy ? "Verifying..." : "Verify OTP"}</button>
      {msg && <small>{msg}</small>}
    </form>
  );
}
