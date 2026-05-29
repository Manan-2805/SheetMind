const { contextBridge, ipcRenderer } = require("electron");

// Fetch the dynamic backend API URL from the main process synchronously
const apiUrl = ipcRenderer.sendSync("get-backend-api-url");

// Validate that the URL is a legitimate local loopback address for security
if (typeof apiUrl === "string" && /^http:\/\/127\.0\.0\.1:\d+\/api$/.test(apiUrl)) {
  // Expose it to the main world window.__SHEETMIND_API_URL__ safely
  contextBridge.exposeInMainWorld("__SHEETMIND_API_URL__", apiUrl);
} else {
  console.error("[Preload] Invalid backend API URL received:", apiUrl);
  contextBridge.exposeInMainWorld("__SHEETMIND_API_URL__", null);
}
