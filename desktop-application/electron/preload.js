const { contextBridge, ipcRenderer } = require("electron");

// Fetch the dynamic backend API URL from the main process synchronously
const apiUrl = ipcRenderer.sendSync("get-backend-api-url");

// Expose it to the main world window.__SHEETMIND_API_URL__ safely
contextBridge.exposeInMainWorld("__SHEETMIND_API_URL__", apiUrl);
