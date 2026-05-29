const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const { spawn } = require("child_process");
const net = require("net");
const fs = require("fs");

let mainWindow = null;
let backendProcess = null;
let backendPort = null;
let backendApiUrl = "";

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
ipcMain.on("get-backend-api-url", (event) => {
  event.returnValue = backendApiUrl;
});

async function startBackend() {
  backendPort = await findFreePort();
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
      env: { ...process.env, SHEETMIND_ENV: "development" }
    });
  } else {
    // Production mode: run the compiled native binary
    const binaryName = process.platform === "win32" ? "sheetmind-backend.exe" : "sheetmind-backend";
    const binaryPath = path.join(process.resourcesPath, "backend", binaryName);

    // Ensure the binary is executable on Unix systems
    if (process.platform !== "win32") {
      try {
        fs.chmodSync(binaryPath, "755");
      } catch (err) {
        console.error("[Electron] Failed to make backend executable:", err);
      }
    }

    backendProcess = spawn(binaryPath, [String(backendPort)], {
      cwd: path.dirname(binaryPath),
      env: { ...process.env, SHEETMIND_ENV: "production" }
    });
  }

  backendProcess.stdout.on("data", (data) => {
    console.log(`[Backend STDOUT] ${data.toString().trim()}`);
  });

  backendProcess.stderr.on("data", (data) => {
    console.error(`[Backend STDERR] ${data.toString().trim()}`);
  });

  backendProcess.on("close", (code) => {
    console.log(`[Electron] Backend process exited with code ${code}`);
  });
}

function stopBackend() {
  if (backendProcess) {
    console.log("[Electron] Stopping backend process...");
    if (process.platform === "win32") {
      // On Windows, taskkill ensures the process tree is killed cleanly
      spawn("taskkill", ["/pid", backendProcess.pid, "/f", "/t"]);
    } else {
      backendProcess.kill("SIGTERM");
    }
    backendProcess = null;
  }
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
  if (!isPackaged) {
    // Development mode: load Vite dev server
    mainWindow.loadURL("http://localhost:5173");
    // Open devtools in dev mode
    mainWindow.webContents.openDevTools();
  } else {
    // Production mode: load static files from resource frontend
    const indexPath = path.join(process.resourcesPath, "frontend", "index.html");
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
    
    // Give backend 1.5 seconds to start up uvicorn completely
    setTimeout(() => {
      createWindow();
    }, 1500);

  } catch (err) {
    console.error("[Electron] Initialization error:", err);
    app.quit();
  }
});

app.on("window-all-closed", () => {
  stopBackend();
  app.quit();
});

app.on("will-quit", () => {
  stopBackend();
});
