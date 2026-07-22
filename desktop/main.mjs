import { app, BrowserWindow, dialog, Menu, shell } from "electron";
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadVinextProdServer } from "./vinext-runtime.mjs";

const APP_ID = "br.com.fafcoffees.eudr";
const TEST_MODE = process.env.EUDR_DESKTOP_TEST === "1";
const SOURCE_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
let mainWindow;
let localServer;

app.setAppUserModelId(APP_ID);

function isLocalAddress(value, port) {
  try {
    const url = new URL(value);
    return url.hostname === "127.0.0.1" && url.port === String(port);
  } catch {
    return false;
  }
}

async function createWindow() {
  const { startProdServer } = await loadVinextProdServer();
  const appRoot = app.isPackaged ? app.getAppPath() : SOURCE_ROOT;
  const outputRoot = app.isPackaged ? path.join(process.resourcesPath, "dist") : path.join(appRoot, "dist");
  localServer = await startProdServer({
    host: "127.0.0.1",
    port: 0,
    outDir: outputRoot,
  });

  mainWindow = new BrowserWindow({
    width: 1440,
    height: 960,
    minWidth: 980,
    minHeight: 720,
    show: false,
    backgroundColor: "#f6f4ee",
    icon: path.join(appRoot, "build", "icon.ico"),
    title: "Preparador EUDR · FAF Coffees",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  const localUrl = `http://127.0.0.1:${localServer.port}`;
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (isLocalAddress(url, localServer.port)) return { action: "allow" };
    shell.openExternal(url);
    return { action: "deny" };
  });
  mainWindow.webContents.on("will-navigate", (event, url) => {
    if (isLocalAddress(url, localServer.port)) return;
    event.preventDefault();
    shell.openExternal(url);
  });
  mainWindow.once("ready-to-show", () => {
    if (!TEST_MODE) mainWindow.show();
  });
  await mainWindow.loadURL(localUrl);
  if (TEST_MODE) {
    console.log(`[desktop-test] Aplicativo carregado em ${localUrl}`);
    await new Promise((resolve) => setTimeout(resolve, 800));
    if (process.env.EUDR_DESKTOP_SCREENSHOT) {
      const screenshot = await mainWindow.webContents.capturePage();
      await writeFile(process.env.EUDR_DESKTOP_SCREENSHOT, screenshot.toPNG());
    }
    app.quit();
  }
}

const hasSingleInstanceLock = app.requestSingleInstanceLock();
if (!hasSingleInstanceLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (!mainWindow) return;
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  });

  app.whenReady().then(async () => {
    Menu.setApplicationMenu(null);
    try {
      await createWindow();
    } catch (error) {
      dialog.showErrorBox(
        "Preparador EUDR",
        `Não foi possível iniciar o aplicativo.\n\n${error instanceof Error ? error.message : String(error)}`,
      );
      app.quit();
    }
  });
}

app.on("before-quit", () => {
  localServer?.server?.close();
});

app.on("window-all-closed", () => {
  app.quit();
});
