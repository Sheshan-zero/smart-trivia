import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { api } from "../api/http";
import { useAuth } from "../store/auth";

export default function AuthGuard({ children, allow = "any" }) {
  const { accessToken, user, setSession, clearSession } = useAuth();
  const [checking, setChecking] = useState(true);
  const [ok, setOk] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function check() {
      try {
        if (!user && accessToken) {
          const { data } = await api.get("/auth/me");
          if (mounted) setSession({ accessToken, user: data.user });
        }
        const finalUser = useAuth.getState().user;
        const pass = !!finalUser && (allow === "any" || finalUser.role === "admin");
        if (mounted) setOk(pass);
      } catch {
        clearSession();
        if (mounted) setOk(false);
      } finally {
        if (mounted) setChecking(false);
      }
    }

    check();
    return () => { mounted = false; };
  }, [accessToken, user, allow, clearSession, setSession]);

  if (checking) return <div style={{ padding: 24, color: "#fff" }}>Checking session…</div>;
  if (!ok) return <Navigate to="/login" replace />;

  return children;
}
