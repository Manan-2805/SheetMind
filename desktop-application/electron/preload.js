const { contextBridge, ipcRenderer } = require("electron");

const { apiUrl, apiToken } = ipcRenderer.sendSync("get-backend-api-config") ?? {};

if (
  typeof apiUrl === "string" &&
  /^http:\/\/127\.0\.0\.1:\d+\/api$/.test(apiUrl) &&
  typeof apiToken === "string" &&
  /^[a-f0-9]{64}$/.test(apiToken)
) {
  contextBridge.exposeInMainWorld("__SHEETMIND_API_URL__", apiUrl);
  contextBridge.exposeInMainWorld("__SHEETMIND_API_TOKEN__", apiToken);
} else {
  console.error("[Preload] Invalid backend API configuration");
}
