// Electron webview custom element for JSX
declare namespace React {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      webview: React.HTMLAttributes<HTMLElement> & {
        src?: string;
        allowpopups?: string;
        partition?: string;
        useragent?: string;
        disablewebsecurity?: string;
        ref?: React.Ref<HTMLElement>;
      };
    }
  }
}

interface Screenshot {
  fileName: string;
  size: number;
  takenAt: string;
}

type NewsBlockType =
  | { type: 'paragraph'; content: string }
  | { type: 'heading';   content: string }
  | { type: 'image';     url: string; caption?: string };

interface ForumTopic {
  id: number;
  title: string;
  body: string;
  category: 'general' | 'bugs' | 'ideas';
  author_name: string;
  pinned: number;
  created_at: string;
  likes_count: number;
  comments_count: number;
  liked: number;
}

interface ForumTopicDetail extends ForumTopic {
  comments: ForumComment[];
}

interface ForumComment {
  id: number;
  author_name: string;
  body: string;
  created_at: string;
}

interface NewsItem {
  id: number;
  title: string;
  body: string;          // JSON-строка NewsBlockType[] или plain-text (legacy)
  cover_image: string | null;
  created_at: string;
  updated_at: string;
}

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

    // Forum
    getForumTopics: (category?: string) => Promise<{ success: boolean; data?: ForumTopic[]; error?: string }>;
    getForumTopic: (id: number) => Promise<{ success: boolean; data?: ForumTopicDetail; error?: string }>;
    createForumTopic: (payload: { title: string; body: string; category: string }) => Promise<{ success: boolean; data?: ForumTopic; error?: string }>;
    addForumComment: (topicId: number, body: string) => Promise<{ success: boolean; data?: ForumComment; error?: string }>;
    toggleForumLike: (topicId: number) => Promise<{ success: boolean; data?: { liked: boolean; likes_count: number }; error?: string }>;

    // News
    getNews: () => Promise<{ success: boolean; data?: NewsItem[]; error?: string }>;

    // Window
    minimizeWindow: () => Promise<void>;
    maximizeWindow: () => Promise<void>;
    closeWindow: () => Promise<void>;

    // Updates
    checkForUpdates: () => Promise<{
      success: boolean;
      data?: {
        updateAvailable: boolean;
        version?: string;
        releaseDate?: string;
        changelog?: string[];
        required?: boolean;
        downloadUrl?: string;
        fileSize?: number;
      };
      error?: string;
    }>;
    downloadUpdate: (downloadUrl: string) => Promise<{ success: boolean; filePath?: string; error?: string }>;
    installUpdate: (filePath?: string) => Promise<{ success: boolean; error?: string }>;
    onUpdateAvailable: (cb: (data: {
      version: string;
      releaseDate: string;
      changelog: string[];
      required: boolean;
      downloadUrl: string;
      fileSize: number;
    }) => void) => () => void;
    onUpdateNotAvailable: (cb: () => void) => () => void;
    onUpdateDownloadProgress: (cb: (data: { percent: number; downloaded: number; total: number }) => void) => () => void;
    onUpdateDownloaded: (cb: (data: { filePath: string }) => void) => () => void;
    onUpdateError: (cb: (data: { message: string }) => void) => () => void;
    onUpdateRequired: (cb: (data: any) => void) => () => void;

    // Shell
    openExternal: (url: string) => Promise<void>;

    // Screenshots
    getScreenshots: () => Promise<{ success: boolean; data: Screenshot[]; error?: string }>;
    getScreenshotImage: (fileName: string) => Promise<string | null>;
    openScreenshot: (fileName: string) => Promise<void>;
    openScreenshotsFolder: () => Promise<void>;
    deleteScreenshot: (fileName: string) => Promise<{ success: boolean; error?: string }>;
  };
}
