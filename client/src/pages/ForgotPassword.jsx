import { useState } from "react";
import { api } from "../api/http";

function HeaderBrand() {
  return (
    <header className="brand">
      <div className="logo-dot">🧠</div>
      <span className="brand-text">SMART-TRIVIA</span>
    </header>
  );
}

export default function ForgotPassword() {
  const [step, setStep] = useState("request"); 
  const [email, setEmail] = useState("");
  const [code, setCode] = useState(["","","","","",""]);
  const [newPassword, setNewPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const sendOtp = async (e) => {
    e.preventDefault();
    setBusy(true);
    setMsg("");
    try {
      await api.post("/auth/request-otp", { email, purpose: "reset" });
      setStep("reset");
      setMsg("OTP sent to your email. It expires in 10 minutes.");
    } catch (e) {
      setMsg(e.response?.data?.error || "Failed to send OTP");
    } finally {
      setBusy(false);
    }
  };

  const onCodeChange = (i, v) => {
    if (!/^\d?$/.test(v)) return;
    const arr = [...code]; arr[i] = v; setCode(arr);
  };

  const handleKey = (i, e) => {
    if (e.key === "Backspace" && !code[i] && i > 0) {
      document.getElementById(`fp-otp-${i-1}`)?.focus();
    } else if (/\d/.test(e.key) && i < 5) {
      setTimeout(() => document.getElementById(`fp-otp-${i+1}`)?.focus(), 0);
    }
  };

  const resetPassword = async (e) => {
    e.preventDefault();
    setBusy(true);
    setMsg("");
    try {
      const joined = code.join("");
      await api.post("/auth/reset-password", { email, code: joined, newPassword });
      setMsg("Password has been reset. You can log in now.");
    } catch (e) {
      setMsg(e.response?.data?.error || "Reset failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="login-shell">
      <HeaderBrand />
      <div className="login-center">
        <div className="login-card">
          <h2 className="login-title">Reset your password</h2>
          <p className="login-sub">We’ll send a 6-digit code to your email</p>

          {step === "request" && (
            <form className="login-form" onSubmit={sendOtp}>
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
              <button className="btn-primary" disabled={busy}>
                {busy ? "Sending..." : "Send OTP"}
              </button>
              <div className="row-between">
                <a className="link-inline" href="/login">Back to login</a>
                <a className="link-inline" href="/signup">Create account</a>
              </div>
              {msg && <div className="notice">{msg}</div>}
            </form>
          )}

          {step === "reset" && (
            <form className="login-form" onSubmit={resetPassword}>
              <label className="otp-label">Enter the 6-digit code</label>
              <div className="otp-grid">
                {code.map((v, i) => (
                  <input
                    key={i}
                    id={`fp-otp-${i}`}
                    className="otp-box"
                    inputMode="numeric"
                    maxLength={1}
                    value={v}
                    onChange={(e) => onCodeChange(i, e.target.value)}
                    onKeyDown={(e) => handleKey(i, e)}
                  />
                ))}
              </div>

              <div className="input-wrap">
                <span className="input-icon">🔒</span>
                <input
                  type="password"
                  placeholder="New password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>

              <button className="btn-primary" disabled={busy}>
                {busy ? "Resetting..." : "Set new password"}
              </button>

              <button type="button" className="btn-ghost" disabled={busy} onClick={() => setStep("request")}>
                ← Change email
              </button>

              <div className="row-between">
                <a className="link-inline" href="/login">Back to login</a>
                <a className="link-inline" onClick={sendOtp}>Resend OTP</a>
              </div>

              {msg && <div className="notice">{msg}</div>}
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
