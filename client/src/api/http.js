import axios from "axios";
import { useAuth } from "../store/auth";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000",
  withCredentials: true, 
});

api.interceptors.request.use((config) => {
  const { accessToken } = useAuth.getState();
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});
let refreshing = null;

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    const status = error.response?.status;

    if (status === 401 && !original._retry) {
      original._retry = true;
      try {
        await axios.post(
          (import.meta.env.VITE_API_URL || "http://localhost:5000") + "/auth/refresh",
          {},
          { withCredentials: true }
        );
        const rf = await axios.post(
          (import.meta.env.VITE_API_URL || "http://localhost:5000") + "/auth/refresh",
          {},
          { withCredentials: true }
        );
        const newToken = rf.data?.accessToken;
        if (newToken) {
          const { user } = useAuth.getState();
          useAuth.getState().setSession({ accessToken: newToken, user });
          original.headers.Authorization = `Bearer ${newToken}`;
          return api(original);
        }
      } catch {
        useAuth.getState().clearSession();
      }
    }
    return Promise.reject(error);
  }
);
