import { app, BrowserWindow, Tray, Menu, nativeImage } from 'electron';
import path from 'path';
import { registerIpcHandlers } from './ipc-handlers';
import { updateManager } from './updater/update-manager';

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;

const isDev = process.argv.includes('--dev') || (
  !app.isPackaged && process.env.VITE_DEV_SERVER === 'true'
);

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1100,
    height: 700,
    minWidth: 900,
    minHeight: 600,
    frame: false,
    resizable: true,
    icon: path.join(__dirname, '../../build/icon.png'),
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webviewTag: true,
    },
    backgroundColor: '#1a1a2e',
    show: false,
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  registerIpcHandlers(mainWindow);

  // Setup update manager
  updateManager.setMainWindow(mainWindow);

  // Window control IPC
  const { ipcMain } = require('electron');
  ipcMain.handle('window:minimize', () => mainWindow?.minimize());
  ipcMain.handle('window:maximize', () => {
    if (mainWindow?.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow?.maximize();
    }
  });
  // Закрыть = свернуть в трей
  ipcMain.handle('window:close', () => mainWindow?.hide());

  // Создание иконки в трее
  const iconPath = path.join(__dirname, '../../build/icon.png');
  const icon = nativeImage.createFromPath(iconPath).resize({ width: 16, height: 16 });
  tray = new Tray(icon);
  tray.setToolTip('SP.A Launcher');

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Открыть',
      click: () => {
        mainWindow?.show();
        mainWindow?.focus();
      },
    },
    { type: 'separator' },
    {
      label: 'Выйти',
      click: () => {
        tray?.destroy();
        app.quit();
      },
    },
  ]);
  tray.setContextMenu(contextMenu);

  tray.on('double-click', () => {
    if (mainWindow?.isVisible()) {
      mainWindow.hide();
    } else {
      mainWindow?.show();
      mainWindow?.focus();
    }
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  // Не выходим — приложение остаётся в трее
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
