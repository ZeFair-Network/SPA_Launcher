import { ipcMain, dialog, BrowserWindow } from 'electron';
import { login, register, getAuth, logout, uploadSkin, deleteSkin } from './auth/auth-manager';
import { downloadMinecraft, isMinecraftInstalled } from './minecraft/downloader';
import { installFabric, isFabricInstalled } from './minecraft/fabric';
import { getModsList, syncMods, toggleMod, deleteMod, addMod, openModsFolder } from './minecraft/mods';
import { launchGame, isGameRunning, getSettings, saveSettings, LaunchSettings } from './minecraft/launcher';
import { findJava, downloadJava } from './utils/java';

export function registerIpcHandlers(mainWindow: BrowserWindow): void {
  // Auth
  ipcMain.handle('auth:login', async (_event, username: string, password: string) => {
    try {
      const data = await login(username, password);
      return { success: true, data };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('auth:register', async (_event, username: string, password: string) => {
    try {
      const data = await register(username, password);
      return { success: true, data };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('auth:get', async () => {
    return getAuth();
  });

  ipcMain.handle('auth:logout', async () => {
    logout();
    return { success: true };
  });

  ipcMain.handle('skin:upload', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'Выберите скин (64x64 PNG)',
      filters: [{ name: 'PNG Image', extensions: ['png'] }],
      properties: ['openFile'],
    });

    if (!result.canceled && result.filePaths.length > 0) {
      try {
        const skinUrl = await uploadSkin(result.filePaths[0]);
        return { success: true, skinUrl };
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    }
    return { success: false, error: 'Файл не выбран' };
  });

  ipcMain.handle('skin:delete', async () => {
    try {
      await deleteSkin();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  });

  // Minecraft download
  ipcMain.handle('mc:is-installed', async () => {
    return isMinecraftInstalled();
  });

  ipcMain.handle('mc:download', async () => {
    try {
      await downloadMinecraft((percent, status) => {
        mainWindow.webContents.send('mc:download-progress', { percent, status });
      });
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  });

  // Fabric
  ipcMain.handle('fabric:is-installed', async () => {
    return isFabricInstalled();
  });

  ipcMain.handle('fabric:install', async () => {
    try {
      await installFabric((percent, status) => {
        mainWindow.webContents.send('fabric:install-progress', { percent, status });
      });
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  });

  // Mods
  ipcMain.handle('mods:list', async () => {
    return getModsList();
  });

  ipcMain.handle('mods:sync', async () => {
    try {
      await syncMods((percent, status) => {
        mainWindow.webContents.send('mods:sync-progress', { percent, status });
      });
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('mods:toggle', async (_event, fileName: string, enabled: boolean) => {
    toggleMod(fileName, enabled);
    return getModsList();
  });

  ipcMain.handle('mods:delete', async (_event, fileName: string) => {
    deleteMod(fileName);
    return getModsList();
  });

  ipcMain.handle('mods:add', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'Выберите мод (.jar)',
      filters: [{ name: 'Java Archive', extensions: ['jar'] }],
      properties: ['openFile', 'multiSelections'],
    });

    if (!result.canceled && result.filePaths.length > 0) {
      for (const filePath of result.filePaths) {
        addMod(filePath);
      }
      return getModsList();
    }
    return null;
  });

  ipcMain.handle('mods:open-folder', async () => {
    openModsFolder();
  });

  // Java
  ipcMain.handle('java:find', async () => {
    return await findJava();
  });

  ipcMain.handle('java:download', async () => {
    try {
      const javaPath = await downloadJava((percent, status) => {
        mainWindow.webContents.send('java:download-progress', { percent, status });
      });
      return { success: true, path: javaPath };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  });

  // Settings
  ipcMain.handle('settings:get', async () => {
    return getSettings();
  });

  ipcMain.handle('settings:save', async (_event, settings: LaunchSettings) => {
    saveSettings(settings);
    return { success: true };
  });

  // Launch game
  ipcMain.handle('game:launch', async () => {
    const auth = getAuth();
    if (!auth) {
      return { success: false, error: 'Необходимо авторизоваться' };
    }

    if (isGameRunning()) {
      return { success: false, error: 'Игра уже запущена' };
    }

    try {
      await launchGame(
        auth.username,
        auth.uuid,
        auth.token,
        (line) => {
          mainWindow.webContents.send('game:log', line);
        },
        (code) => {
          mainWindow.webContents.send('game:exit', code);
        }
      );
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('game:is-running', async () => {
    return isGameRunning();
  });
}
