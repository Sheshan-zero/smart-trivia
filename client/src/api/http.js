import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000",
  withCredentials: true, 
});

api.interceptors.request.use((config) => {
  const at = localStorage.getItem("accessToken");
  if (at) config.headers.Authorization = `Bearer ${at}`;
  return config;
});

let refreshing = null;
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    const status = error?.response?.status;

    if (status === 401 && !original._retry) {
      original._retry = true;
      try {
        refreshing = refreshing || axios.post(
          (import.meta.env.VITE_API_URL || "http://localhost:5000") + "/auth/refresh",
          {},
          { withCredentials: true }
        );
        const { data } = await refreshing;
        refreshing = null;

        if (data?.accessToken) {
          localStorage.setItem("accessToken", data.accessToken);
          original.headers.Authorization = `Bearer ${data.accessToken}`;
          return api(original); 
        }
      } catch (_) {
        refreshing = null;
      }
    }
    return Promise.reject(error);
  }
);
