import axios from "axios";
import { apiBaseUrl } from "./apiUrl";

export const apiClient = axios.create({
  baseURL: apiBaseUrl,
});

apiClient.interceptors.request.use((config) => {
  const username = localStorage.getItem("sheetmind-username");
  if (username) {
    config.headers["X-Username"] = username;
  }
  return config;
});
