import axios from "axios";

export const apiClient = axios.create({ baseURL: "http://localhost:8000/api" });

apiClient.interceptors.request.use((config) => {
  const username = localStorage.getItem("sheetmind-username");
  if (username) {
    config.headers["X-Username"] = username;
  }
  return config;
});
