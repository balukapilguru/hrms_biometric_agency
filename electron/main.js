const { app, BrowserWindow, Tray, Menu } = require("electron");
const path = require("path");

let tray = null;

function createWindow() {
  const win = new BrowserWindow({
    width: 1100,
    height: 700,
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  win.loadURL("http://127.0.0.1:4001");
}

app.whenReady().then(() => {
  require("../server");

  createWindow();

  tray = new Tray("icon.png");

  const contextMenu = Menu.buildFromTemplate([
    {
      label: "Open",
      click: () => createWindow(),
    },
    {
      label: "Exit",
      click: () => app.quit(),
    },
  ]);

  tray.setToolTip("Emplai Biometric Agent");
  tray.setContextMenu(contextMenu);
});

app.on("window-all-closed", () => {
  // DO NOT QUIT AGENT
});