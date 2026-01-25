import { app, BrowserWindow } from "electron";
import * as path from "path";
import { ChildProcess, fork } from "child_process";
import isDev from "electron-is-dev";

let mainWindow: BrowserWindow | null = null;
let serverProcess: ChildProcess | null = null;

// Get the correct path to the server
function getServerPath(): string {
  if (isDev) {
    return path.join(__dirname, "../../src/server/index.ts");
  }

  // In production, check if running from ASAR
  if (process.resourcesPath) {
    // electron-builder packages the dist folder into app.asar
    return path.join(process.resourcesPath, "app.asar", "dist", "server", "index.js");
  }

  // Fallback for unpacked builds
  return path.join(__dirname, "../server/index.js");
}

// Start the backend server
function startServer(): Promise<void> {
  return new Promise((resolve, reject) => {
    const serverPath = getServerPath();
    console.log("[Main] Starting server from:", serverPath);
    console.log("[Main] isDev:", isDev);
    console.log("[Main] resourcesPath:", process.resourcesPath);
    console.log("[Main] __dirname:", __dirname);

    if (isDev) {
      // In development, we rely on the separate dev:server script
      console.log("[Main] Development mode - server started separately");
      resolve();
      return;
    }

    try {
      // In production, spawn the server as a child process
      serverProcess = fork(serverPath, [], {
        env: {
          ...process.env,
          NODE_ENV: "production",
          // Pass the resources path so server can find upload folder, etc.
          RESOURCES_PATH: process.resourcesPath || app.getAppPath()
        },
        stdio: ["pipe", "pipe", "pipe", "ipc"]
      });

      serverProcess.stdout?.on("data", (data) => {
        console.log(`[Server] ${data.toString()}`);
      });

      serverProcess.stderr?.on("data", (data) => {
        console.error(`[Server Error] ${data.toString()}`);
      });

      serverProcess.on("error", (err) => {
        console.error("[Main] Server process error:", err);
        reject(err);
      });

      serverProcess.on("exit", (code) => {
        console.log(`[Main] Server process exited with code ${code}`);
        if (code !== 0 && code !== null) {
          reject(new Error(`Server exited with code ${code}`));
        }
        serverProcess = null;
      });

      // Wait for server to send ready message
      const timeout = setTimeout(() => {
        console.log("[Main] Server startup timeout - assuming ready");
        resolve();
      }, 5000);

      serverProcess.on("message", (msg: any) => {
        if (msg === "server-ready" || msg?.type === "ready") {
          clearTimeout(timeout);
          console.log("[Main] Server confirmed ready");
          resolve();
        }
      });

    } catch (error) {
      console.error("[Main] Failed to start server:", error);
      reject(error);
    }
  });
}

// Stop the backend server
function stopServer(): void {
  if (serverProcess) {
    console.log("[Main] Stopping server...");
    serverProcess.kill("SIGTERM");

    // Force kill after 5 seconds
    setTimeout(() => {
      if (serverProcess && !serverProcess.killed) {
        console.log("[Main] Force killing server...");
        serverProcess.kill("SIGKILL");
      }
    }, 5000);

    serverProcess = null;
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    backgroundColor: "#020617",
    title: "Factory Inventory",
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.once("ready-to-show", () => {
    mainWindow?.show();
  });

  if (isDev) {
    mainWindow.loadURL("http://localhost:5173");
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, "../renderer/index.html"));
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

app.whenReady().then(async () => {
  try {
    console.log("[Main] App ready, starting server...");
    await startServer();

    console.log("[Main] Creating window...");
    createWindow();

    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  } catch (error) {
    console.error("[Main] Failed to start application:", error);
    app.quit();
  }
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    stopServer();
    app.quit();
  }
});

app.on("before-quit", () => {
  stopServer();
});

app.on("will-quit", () => {
  stopServer();
});