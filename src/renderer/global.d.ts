interface Window {
  api: {
    // Auth
    login: (username: string, password: string) => Promise<{ success: boolean; data?: any; error?: string }>;
    register: (username: string, password: string) => Promise<{ success: boolean; data?: any; error?: string }>;
    getAuth: () => Promise<{ username: string; uuid: string; token: string } | null>;
    logout: () => Promise<{ success: boolean }>;

    // Minecraft
    isMinecraftInstalled: () => Promise<boolean>;
    downloadMinecraft: () => Promise<{ success: boolean; error?: string }>;
    onDownloadProgress: (cb: (data: { percent: number; status: string }) => void) => () => void;

    // Fabric
    isFabricInstalled: () => Promise<boolean>;
    installFabric: () => Promise<{ success: boolean; error?: string }>;
    onFabricProgress: (cb: (data: { percent: number; status: string }) => void) => () => void;

    // Mods
    getModsList: () => Promise<Array<{ fileName: string; enabled: boolean; size: number }>>;
    syncMods: () => Promise<{ success: boolean; error?: string }>;
    onSyncProgress: (cb: (data: { percent: number; status: string }) => void) => () => void;
    toggleMod: (fileName: string, enabled: boolean) => Promise<any>;
    deleteMod: (fileName: string) => Promise<any>;
    addMod: () => Promise<any>;
    openModsFolder: () => Promise<void>;

    // Java
    findJava: () => Promise<string | null>;
    downloadJava: () => Promise<{ success: boolean; path?: string; error?: string }>;
    onJavaProgress: (cb: (data: { percent: number; status: string }) => void) => () => void;

    // Settings
    getSettings: () => Promise<{
      minRam: string;
      maxRam: string;
      javaPath: string;
      jvmArgs: string;
      autoConnect: boolean;
    }>;
    saveSettings: (settings: any) => Promise<{ success: boolean }>;

    // Game
    launchGame: () => Promise<{ success: boolean; error?: string }>;
    isGameRunning: () => Promise<boolean>;
    onGameLog: (cb: (line: string) => void) => () => void;
    onGameExit: (cb: (code: number | null) => void) => () => void;

    // Window
    minimizeWindow: () => Promise<void>;
    maximizeWindow: () => Promise<void>;
    closeWindow: () => Promise<void>;
  };
}
