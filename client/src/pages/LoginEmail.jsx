import { useEffect, useState } from "react";
import { api } from "../api/http";
import { useAuth } from "../store/auth";
import LoginPassword from "./LoginPassword";

const MailIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path d="M4 6h16v12H4z" stroke="currentColor" strokeWidth="1.6" />
    <path d="M4 7l8 6 8-6" stroke="currentColor" strokeWidth="1.6" fill="none" />
  </svg>
);
const LockIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <rect x="4" y="10" width="16" height="10" rx="2" stroke="currentColor" strokeWidth="1.6"/>
    <path d="M8 10V8a4 4 0 1 1 8 0v2" stroke="currentColor" strokeWidth="1.6"/>
  </svg>
);

export default function LoginEmail() {
  const { user } = useAuth();
  const setSession = useAuth((s) => s.setSession);


  const [tab, setTab] = useState("otp");
  const [email, setEmail] = useState("");
  const [step, setStep] = useState("email");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    document.title = "Smart Trivia — Login";
  }, []);

  const handleSendOtp = async (e) => {
    e?.preventDefault?.();
    setBusy(true);
    setMsg("");
    try {
      await api.post("/auth/request-otp", { email, purpose: "login" });
      setStep("otp");
      setMsg("OTP sent to your email. It expires in 10 minutes.");
    } catch (e) {
      setMsg(e.response?.data?.error || "Failed to send OTP");
    } finally {
      setBusy(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setBusy(true);
    setMsg("");
    try {
      const code = otp.join("");
      const { data } = await api.post("/auth/verify-otp", { email, code, purpose: "login" });
      setSession({ accessToken: data.accessToken, user: data.user });
      setMsg("Logged in!");
    } catch (e) {
      setMsg(e.response?.data?.error || "Verification failed");
    } finally {
      setBusy(false);
    }
  };

  const updateOtpAt = (index, value) => {
    if (!/^\d?$/.test(value)) return; 
    const copy = [...otp];
    copy[index] = value;
    setOtp(copy);
  };

  const handleOtpKey = (i, e) => {
    if (e.key === "Backspace" && !otp[i] && i > 0) {
      const prev = document.getElementById(`otp-${i - 1}`);
      prev?.focus(); prev?.select?.();
    } else if (/\d/.test(e.key) && i < 5) {
      setTimeout(() => document.getElementById(`otp-${i + 1}`)?.focus(), 0);
    }
  };

  if (user) {
    return (
      <div className="login-shell">
        <HeaderBrand />
        <div className="login-center">
          <div className="login-card">
            <h2 className="login-title">You're in 🎉</h2>
            <p className="login-sub">Welcome, {user.email}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-shell">
      <HeaderBrand />
      <div className="login-center">
        <div className="login-card">
          <h2 className="login-title">Log in to your account</h2>
          <p className="login-sub">Choose your method</p>

          <div className="tabs">
            <button
              className={`tab ${tab === "otp" ? "active" : ""}`}
              onClick={() => setTab("otp")}
              type="button"
            >
              OTP Login
            </button>
            <button
              className={`tab ${tab === "password" ? "active" : ""}`}
              onClick={() => setTab("password")}
              type="button"
            >
              Password Login
            </button>
          </div>

          {tab === "otp" ? (
            <OtpPanel
              step={step}
              email={email}
              setEmail={setEmail}
              otp={otp}
              setOtp={setOtp}
              busy={busy}
              msg={msg}
              setMsg={setMsg}
              handleSendOtp={handleSendOtp}
              handleVerify={handleVerify}
              updateOtpAt={updateOtpAt}
              handleOtpKey={handleOtpKey}
              setStep={setStep}
            />
          ) : (
            <LoginPassword />
          )}
          {tab === "otp" && msg && <div className="notice">{msg}</div>}
        </div>
      </div>
    </div>
  );
}

function OtpPanel({
  step,
  email,
  setEmail,
  otp,
  busy,
  handleSendOtp,
  handleVerify,
  updateOtpAt,
  handleOtpKey,
  setStep,
}) {
  return (
    <>
      {step === "email" && (
        <form className="login-form" onSubmit={handleSendOtp}>
          <div className="input-wrap">
            <span className="input-icon"><MailIcon /></span>
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
            <a className="link-muted" href="/forgot">Forgot password?</a>
            <span className="muted">
              No account? <a className="link-inline" href="/signup">Sign up</a>
            </span>
          </div>
        </form>
      )}

      {step === "otp" && (
        <form className="login-form form-narrow" onSubmit={handleVerify}>
          <label className="otp-label"><LockIcon /> Enter 6-digit code</label>
          <div className="otp-grid">
            {otp.map((v, i) => (
              <input
                key={i}
                id={`otp-${i}`}
                className="otp-box"
                inputMode="numeric"
                maxLength={1}
                value={v}
                onChange={(e) => updateOtpAt(i, e.target.value)}
                onKeyDown={(e) => handleOtpKey(i, e)}
              />
            ))}
          </div>

          <button className="btn-primary" disabled={busy}>
            {busy ? "Verifying..." : "Login"}
          </button>

          <button
            type="button"
            className="btn-ghost"
            disabled={busy}
            onClick={() => setStep("email")}
          >
            ← Change email
          </button>

          <p className="muted small">
            Didn’t get it? Check spam or{" "}
            <button type="button" className="link-inline" onClick={handleSendOtp} disabled={busy}>
              resend OTP
            </button>.
          </p>
        </form>
      )}
    </>
  );
}

function HeaderBrand() {
  return (
    <header className="brand">
      <div className="logo-dot">🧠</div>
      <span className="brand-text">SMART-TRIVIA</span>
    </header>
  );
}
