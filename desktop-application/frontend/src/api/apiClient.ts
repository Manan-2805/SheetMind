import axios from "axios";
import { apiBaseUrl, apiToken } from "./apiUrl";

export const apiClient = axios.create({
  baseURL: apiBaseUrl,
  allowAbsoluteUrls: false,
});

apiClient.interceptors.request.use((config) => {
  const username = localStorage.getItem("sheetmind-username");
  if (username) {
    config.headers["X-Username"] = username;
  }
  if (apiToken) config.headers["X-SheetMind-Token"] = apiToken;
  return config;
});
