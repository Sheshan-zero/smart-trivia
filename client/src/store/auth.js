import { create } from "zustand";

const initial = (() => {
  try { return JSON.parse(localStorage.getItem("st_session") || "{}"); } catch { return {}; }
})();

export const useAuth = create((set) => ({
  accessToken: initial.accessToken || null,
  user: initial.user || null,
  setSession: ({ accessToken, user }) => {
    localStorage.setItem("st_session", JSON.stringify({ accessToken, user }));
    set({ accessToken, user });
  },
  clearSession: () => {
    localStorage.removeItem("st_session");
    set({ accessToken: null, user: null });
  },
}));
