import axios from "axios";

export const apiClient = axios.create({
  baseURL: window.__SHEETMIND_API_URL__ || "http://localhost:8000/api",
});

apiClient.interceptors.request.use((config) => {
  const username = localStorage.getItem("sheetmind-username");
  if (username) {
    config.headers["X-Username"] = username;
  }
  return config;
});
