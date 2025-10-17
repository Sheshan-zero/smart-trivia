import axios from "axios";
import { useAuth } from "../store/auth";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000",
  withCredentials: true, 
});

api.interceptors.request.use((config) => {
  const token = useAuth.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let refreshing = null;
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original.__retried) {
      try {
        if (!refreshing) {
          refreshing = api.post("/auth/refresh").finally(() => (refreshing = null));
        }
        const { data } = await refreshing; 
        useAuth.getState().setAccessToken(data.accessToken);
        original.headers = { ...(original.headers || {}), Authorization: `Bearer ${data.accessToken}` };
        original.__retried = true;
        return api.request(original);
      } catch {
        useAuth.getState().clearSession();
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);
