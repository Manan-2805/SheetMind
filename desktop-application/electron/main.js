const { spawn } = require("node:child_process");
const { randomBytes } = require("node:crypto");
const net = require("node:net");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const { app, BrowserWindow, dialog, ipcMain, shell } = require("electron");

let mainWindow = null;
let backendProcess = null;
let backendApiUrl = "";
let isQuitting = false;
const backendApiToken = randomBytes(32).toString("hex");
const devAppUrl = "http://localhost:5173";

// Helper to find a free port
function findFreePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.listen(0, "127.0.0.1", () => {
      const port = server.address().port;
      server.close(() => {
        resolve(port);
      });
    });
    server.on("error", (err) => {
      reject(err);
    });
  });
}

// IPC handler to return the API URL synchronously to preload
ipcMain.on("get-backend-api-config", (event) => {
  event.returnValue =
    mainWindow && event.senderFrame === mainWindow.webContents.mainFrame
      ? { apiUrl: backendApiUrl, apiToken: backendApiToken }
      : null;
});

async function startBackend() {
  const backendPort = await findFreePort();
  if (isQuitting) return;
  backendApiUrl = `http://127.0.0.1:${backendPort}/api`;
  console.log(`[Electron] Starting backend on port ${backendPort}...`);

  const isPackaged = app.isPackaged;

  if (!isPackaged) {
    // Development mode: run Python script directly
    const backendDir = path.join(__dirname, "..", "backend");
    const venvPython = process.platform === "win32"
      ? path.join(backendDir, ".venv", "Scripts", "python.exe")
      : path.join(backendDir, ".venv", "bin", "python");

    backendProcess = spawn(venvPython, ["-B", "main.py", String(backendPort)], {
      cwd: backendDir,
      env: {
        ...process.env,
        SHEETMIND_ENV: "development",
        SHEETMIND_API_TOKEN: backendApiToken
      }
    });
  } else {
    // Production mode: run the compiled native binary
    const binaryName = process.platform === "win32" ? "sheetmind-backend.exe" : "sheetmind-backend";
    const binaryPath = path.join(process.resourcesPath, "backend", binaryName);

    backendProcess = spawn(binaryPath, [String(backendPort)], {
      cwd: path.dirname(binaryPath),
      env: {
        ...process.env,
        SHEETMIND_ENV: "production",
        SHEETMIND_API_TOKEN: backendApiToken
      }
    });
  }

  backendProcess.stdout.on("data", (data) => {
    console.log(`[Backend STDOUT] ${data.toString().trim()}`);
  });

  backendProcess.stderr.on("data", (data) => {
    console.error(`[Backend STDERR] ${data.toString().trim()}`);
  });

  const child = backendProcess;
  child.on("error", (error) => {
    console.error("[Electron] Backend process error:", error.code);
    app.quit();
  });
  child.on("close", (code) => {
    if (backendProcess === child) backendProcess = null;
    console.log(`[Electron] Backend process exited with code ${code}`);
  });
}

async function waitForBackend() {
  const deadline = Date.now() + 60_000;
  while (!isQuitting && backendProcess && Date.now() < deadline) {
    try {
      const response = await fetch(`${backendApiUrl}/health`, {
        signal: AbortSignal.timeout(1_000),
      });
      if (response.ok) return;
    } catch {
      // The process may still be unpacking or opening its listener.
    }
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  if (!isQuitting) throw new Error("The local backend did not become ready");
}

function stopBackend() {
  const child = backendProcess;
  backendProcess = null;
  if (!child?.pid) return;
  console.log("[Electron] Stopping backend process...");
  if (process.platform === "win32") {
    const killer = spawn("taskkill", ["/pid", String(child.pid), "/f", "/t"]);
    killer.on("error", () => child.kill());
  } else {
    child.kill("SIGTERM");
  }
}

function isAppNavigation(url, entry) {
  if (!URL.canParse(url)) return false;
  const target = new URL(url);
  if (entry.protocol === "file:") {
    return target.protocol === "file:" && target.host === entry.host &&
      target.pathname === entry.pathname;
  }
  return target.origin === entry.origin;
}

function openExternalLink(url) {
  if (!URL.canParse(url)) return;
  const target = new URL(url);
  if (target.protocol === "https:" || target.protocol === "http:") {
    void shell.openExternal(target.href).catch(() => {
      console.error("[Electron] Could not open browser link");
    });
  }
}

function normalizePackagedWebSocketOrigin(webContents) {
  const socketUrl = new URL(`${backendApiUrl}/ws/datasources`);
  socketUrl.protocol = "ws:";
  const rendererId = webContents.id;
  webContents.session.webRequest.onBeforeSendHeaders(
    { urls: [`${socketUrl.href}*`] },
    ({ url, webContentsId, requestHeaders }, callback) => {
      if (webContentsId === rendererId && new URL(url).pathname === socketUrl.pathname) {
        const originHeader = Object.keys(requestHeaders).find((name) => name.toLowerCase() === "origin");
        // Chromium serializes a packaged file origin differently for WebSocket handshakes.
        if (originHeader && requestHeaders[originHeader] === "file://") {
          requestHeaders[originHeader] = "null";
        }
      }
      callback({ requestHeaders });
    },
  );
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 768,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    },
    icon: path.join(__dirname, "assets", process.platform === "win32" ? "icon.ico" : "icon.png"),
    title: "SheetMind"
  });

  mainWindow.setMenuBarVisibility(false);

  const isPackaged = app.isPackaged;
  const indexPath = isPackaged
    ? path.join(process.resourcesPath, "frontend", "index.html")
    : null;
  const entry = indexPath ? pathToFileURL(indexPath) : new URL(devAppUrl);
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    openExternalLink(url);
    return { action: "deny" };
  });
  const blockExternalNavigation = (event, url) => {
    if (isAppNavigation(url, entry)) return;
    event.preventDefault();
    openExternalLink(url);
  };
  mainWindow.webContents.on("will-navigate", blockExternalNavigation);
  mainWindow.webContents.on("will-redirect", blockExternalNavigation);
  mainWindow.on("session-end", stopBackend);

  if (!isPackaged) {
    // Development mode: load Vite dev server
    mainWindow.loadURL(devAppUrl);
    // Open devtools in dev mode
    mainWindow.webContents.openDevTools();
  } else {
    // Production mode: load static files from resource frontend
    normalizePackagedWebSocketOrigin(mainWindow.webContents);
    mainWindow.loadFile(indexPath);
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

// App lifecycle management
app.whenReady().then(async () => {
  try {
    await startBackend();
    await waitForBackend();
    if (isQuitting) return;
    
    // Set up React DevTools in development mode
    if (!app.isPackaged) {
      try {
        const installer = require("electron-devtools-installer");
        const installExtension = installer.default;
        const { REACT_DEVELOPER_TOOLS } = installer;
        
        const name = await installExtension(REACT_DEVELOPER_TOOLS);
        console.log(`[Electron] Added extension: ${name}`);
      } catch (err) {
        console.error("[Electron] Failed to install React DevTools:", err);
      }
    }
    
    if (!isQuitting) createWindow();

  } catch (err) {
    console.error("[Electron] Initialization error:", err);
    dialog.showErrorBox("SheetMind could not start", "The local backend did not respond.");
    app.quit();
  }
});

app.on("window-all-closed", () => {
  stopBackend();
  app.quit();
});

app.on("before-quit", () => {
  isQuitting = true;
  stopBackend();
});

app.on("will-quit", stopBackend);
process.once("SIGINT", () => app.quit());
process.once("SIGTERM", () => app.quit());
process.once("exit", stopBackend);
