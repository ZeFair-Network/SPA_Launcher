import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('api', {
  // Auth
  login: (username: string, password: string) => ipcRenderer.invoke('auth:login', username, password),
  register: (username: string, password: string) => ipcRenderer.invoke('auth:register', username, password),
  getAuth: () => ipcRenderer.invoke('auth:get'),
  logout: () => ipcRenderer.invoke('auth:logout'),

  // Skin
  uploadSkin: () => ipcRenderer.invoke('skin:upload'),
  deleteSkin: () => ipcRenderer.invoke('skin:delete'),

  // Minecraft
  isMinecraftInstalled: () => ipcRenderer.invoke('mc:is-installed'),
  downloadMinecraft: () => ipcRenderer.invoke('mc:download'),
  onDownloadProgress: (cb: (data: { percent: number; status: string }) => void) => {
    const handler = (_event: any, data: any) => cb(data);
    ipcRenderer.on('mc:download-progress', handler);
    return () => ipcRenderer.removeListener('mc:download-progress', handler);
  },

  // Fabric
  isFabricInstalled: () => ipcRenderer.invoke('fabric:is-installed'),
  installFabric: () => ipcRenderer.invoke('fabric:install'),
  onFabricProgress: (cb: (data: { percent: number; status: string }) => void) => {
    const handler = (_event: any, data: any) => cb(data);
    ipcRenderer.on('fabric:install-progress', handler);
    return () => ipcRenderer.removeListener('fabric:install-progress', handler);
  },

  // Mods
  getModsList: () => ipcRenderer.invoke('mods:list'),
  syncMods: () => ipcRenderer.invoke('mods:sync'),
  onSyncProgress: (cb: (data: { percent: number; status: string }) => void) => {
    const handler = (_event: any, data: any) => cb(data);
    ipcRenderer.on('mods:sync-progress', handler);
    return () => ipcRenderer.removeListener('mods:sync-progress', handler);
  },
  toggleMod: (fileName: string, enabled: boolean) => ipcRenderer.invoke('mods:toggle', fileName, enabled),
  deleteMod: (fileName: string) => ipcRenderer.invoke('mods:delete', fileName),
  addMod: () => ipcRenderer.invoke('mods:add'),
  openModsFolder: () => ipcRenderer.invoke('mods:open-folder'),

  // Java
  findJava: () => ipcRenderer.invoke('java:find'),
  downloadJava: () => ipcRenderer.invoke('java:download'),
  onJavaProgress: (cb: (data: { percent: number; status: string }) => void) => {
    const handler = (_event: any, data: any) => cb(data);
    ipcRenderer.on('java:download-progress', handler);
    return () => ipcRenderer.removeListener('java:download-progress', handler);
  },

  // Settings
  getSettings: () => ipcRenderer.invoke('settings:get'),
  saveSettings: (settings: any) => ipcRenderer.invoke('settings:save', settings),

  // Game
  launchGame: () => ipcRenderer.invoke('game:launch'),
  isGameRunning: () => ipcRenderer.invoke('game:is-running'),
  onGameLog: (cb: (line: string) => void) => {
    const handler = (_event: any, line: string) => cb(line);
    ipcRenderer.on('game:log', handler);
    return () => ipcRenderer.removeListener('game:log', handler);
  },
  onGameExit: (cb: (code: number | null) => void) => {
    const handler = (_event: any, code: number | null) => cb(code);
    ipcRenderer.on('game:exit', handler);
    return () => ipcRenderer.removeListener('game:exit', handler);
  },

  // Window controls
  minimizeWindow: () => ipcRenderer.invoke('window:minimize'),
  maximizeWindow: () => ipcRenderer.invoke('window:maximize'),
  closeWindow: () => ipcRenderer.invoke('window:close'),

  // Updates
  checkForUpdates: () => ipcRenderer.invoke('updates:check'),
  downloadUpdate: (downloadUrl: string) => ipcRenderer.invoke('updates:download', downloadUrl),
  installUpdate: (filePath?: string) => ipcRenderer.invoke('updates:install', filePath),
  onUpdateAvailable: (cb: (data: any) => void) => {
    const handler = (_event: any, data: any) => cb(data);
    ipcRenderer.on('update-available', handler);
    return () => ipcRenderer.removeListener('update-available', handler);
  },
  onUpdateNotAvailable: (cb: () => void) => {
    const handler = () => cb();
    ipcRenderer.on('update-not-available', handler);
    return () => ipcRenderer.removeListener('update-not-available', handler);
  },
  onUpdateDownloadProgress: (cb: (data: { percent: number; downloaded: number; total: number }) => void) => {
    const handler = (_event: any, data: any) => cb(data);
    ipcRenderer.on('update-download-progress', handler);
    return () => ipcRenderer.removeListener('update-download-progress', handler);
  },
  onUpdateDownloaded: (cb: (data: { filePath: string }) => void) => {
    const handler = (_event: any, data: any) => cb(data);
    ipcRenderer.on('update-downloaded', handler);
    return () => ipcRenderer.removeListener('update-downloaded', handler);
  },
  onUpdateError: (cb: (data: { message: string }) => void) => {
    const handler = (_event: any, data: any) => cb(data);
    ipcRenderer.on('update-error', handler);
    return () => ipcRenderer.removeListener('update-error', handler);
  },
  onUpdateRequired: (cb: (data: any) => void) => {
    const handler = (_event: any, data: any) => cb(data);
    ipcRenderer.on('update-required', handler);
    return () => ipcRenderer.removeListener('update-required', handler);
  },
});
