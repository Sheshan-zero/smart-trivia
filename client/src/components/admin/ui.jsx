export function Panel({ title, right, children }) {
  return (
    <div className="ad-panel">
      <div className="ad-panel-title">
        <span>{title}</span>
        <span>{right}</span>
      </div>
      <div className="ad-panel-body">{children}</div>
    </div>
  );
}

export function Field({ label, children, hint }) {
  return (
    <label className="ad-field">
      <div className="ad-field-label">{label}</div>
      {children}
      {hint && <div className="ad-field-hint">{hint}</div>}
    </label>
  );
}

export function Input(props) {
  return <input className="ad-input" {...props} />;
}
export function Textarea(props) {
  return <textarea className="ad-textarea" rows={3} {...props} />;
}
export function Select(props) {
  return <select className="ad-select" {...props} />;
}
export function Button({ variant = "primary", ...props }) {
  return <button className={`ad-btn ${variant}`} {...props} />;
}
export function Badge({ tone = "muted", children }) {
  return <span className={`ad-badge ${tone}`}>{children}</span>;
}
export function Switch({ checked, onChange }) {
  return (
    <button
      type="button"
      className={`ad-switch ${checked ? "on" : ""}`}
      onClick={() => onChange(!checked)}
      aria-pressed={checked}
    >
      <span />
    </button>
  );
}
