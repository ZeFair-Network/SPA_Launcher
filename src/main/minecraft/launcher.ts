import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import fs from 'fs';
import { getMinecraftDir, getLibrariesDir, getAssetsDir, getNativesDir, getVersionsDir } from '../utils/paths';
import { findJava } from '../utils/java';
import { getVersionData } from './downloader';
import { getFabricProfile, getFabricVersionId } from './fabric';
import { storeGet, storeSet } from '../utils/store';
import { MINECRAFT_CONFIG } from './config';

const SERVER_ADDRESS = MINECRAFT_CONFIG.serverAddress;
const MC_VERSION = MINECRAFT_CONFIG.version;

const DEFAULT_SETTINGS: LaunchSettings = {
  minRam: '512',
  maxRam: '2048',
  javaPath: '',
  jvmArgs: '',
  autoConnect: true,
};

export interface LaunchSettings {
  minRam: string;
  maxRam: string;
  javaPath: string;
  jvmArgs: string;
  autoConnect: boolean;
}

export function getSettings(): LaunchSettings {
  return storeGet<LaunchSettings>('settings', DEFAULT_SETTINGS);
}

export function saveSettings(settings: LaunchSettings): void {
  storeSet('settings', settings);
}

let gameProcess: ChildProcess | null = null;

export async function launchGame(
  username: string,
  uuid: string,
  accessToken: string,
  onLog: (line: string) => void,
  onExit: (code: number | null) => void
): Promise<void> {
  if (gameProcess) {
    throw new Error('Игра уже запущена');
  }

  const settings = getSettings();

  // Find Java
  let javaPath = settings.javaPath || (await findJava());
  if (!javaPath) {
    throw new Error('Java не найдена. Установите Java или скачайте через настройки.');
  }

  // Build classpath
  const classpath = buildClasspath();

  // Build arguments
  const fabricProfile = getFabricProfile();
  const vanillaData = getVersionData();

  if (!vanillaData) {
    throw new Error('Minecraft не установлен');
  }

  const mainClass = fabricProfile?.mainClass || vanillaData.mainClass;
  const assetIndex = vanillaData.assetIndex.id;

  const gameDir = getMinecraftDir();
  const nativesDir = getNativesDir();

  const jvmArgs: string[] = [
    `-Xms${settings.minRam}M`,
    `-Xmx${settings.maxRam}M`,
    `-Djava.library.path=${nativesDir}`,
    '-Dminecraft.launcher.brand=spa-launcher',
    '-Dminecraft.launcher.version=1.0.0',
  ];

  // Custom JVM args
  if (settings.jvmArgs) {
    jvmArgs.push(...settings.jvmArgs.split(' ').filter(Boolean));
  }

  jvmArgs.push('-cp', classpath);
  jvmArgs.push(mainClass);

  // Game arguments
  const gameArgs: string[] = [
    '--username', username,
    '--version', getFabricVersionId() || MC_VERSION,
    '--gameDir', gameDir,
    '--assetsDir', getAssetsDir(),
    '--assetIndex', assetIndex,
    '--uuid', uuid,
    '--accessToken', accessToken,
    '--userType', 'legacy',
    '--versionType', 'release',
  ];

  // Auto-connect to server
  if (settings.autoConnect) {
    const parts = SERVER_ADDRESS.split(':');
    gameArgs.push('--server', parts[0]);
    if (parts.length > 1) {
      gameArgs.push('--port', parts[1]);
    }
  }

  const allArgs = [...jvmArgs, ...gameArgs];

  onLog(`Запускаю: ${javaPath}`);
  onLog(`Аргументы: ${allArgs.join(' ')}`);

  gameProcess = spawn(javaPath, allArgs, {
    cwd: gameDir,
    env: { ...process.env },
  });

  gameProcess.stdout?.on('data', (data: Buffer) => {
    data.toString().split('\n').filter(Boolean).forEach(onLog);
  });

  gameProcess.stderr?.on('data', (data: Buffer) => {
    data.toString().split('\n').filter(Boolean).forEach(onLog);
  });

  gameProcess.on('close', (code) => {
    gameProcess = null;
    onExit(code);
  });

  gameProcess.on('error', (err) => {
    gameProcess = null;
    onLog(`Ошибка: ${err.message}`);
    onExit(-1);
  });
}

export function isGameRunning(): boolean {
  return gameProcess !== null;
}

function buildClasspath(): string {
  const separator = process.platform === 'win32' ? ';' : ':';
  const paths: string[] = [];

  // Add vanilla libraries
  const vanillaData = getVersionData();
  if (vanillaData?.libraries) {
    for (const lib of vanillaData.libraries) {
      if (!isLibraryAllowed(lib)) continue;
      if (lib.downloads?.artifact) {
        const libPath = path.join(getLibrariesDir(), lib.downloads.artifact.path);
        if (fs.existsSync(libPath)) {
          paths.push(libPath);
        }
      }
    }
  }

  // Add Fabric libraries
  const fabricProfile = getFabricProfile();
  if (fabricProfile?.libraries) {
    for (const lib of fabricProfile.libraries) {
      const libPath = mavenToPath(lib.name);
      const fullPath = path.join(getLibrariesDir(), libPath);
      if (fs.existsSync(fullPath)) {
        paths.push(fullPath);
      }
    }
  }

  // Add client jar
  const clientJar = path.join(getVersionsDir(), MC_VERSION, `${MC_VERSION}.jar`);
  if (fs.existsSync(clientJar)) {
    paths.push(clientJar);
  }

  return paths.join(separator);
}

function isLibraryAllowed(lib: any): boolean {
  if (!lib.rules) return true;
  let allowed = false;
  for (const rule of lib.rules) {
    if (rule.action === 'allow') {
      if (!rule.os) allowed = true;
      else if (rule.os.name === getOsName()) allowed = true;
    } else if (rule.action === 'disallow') {
      if (rule.os && rule.os.name === getOsName()) allowed = false;
    }
  }
  return allowed;
}

function getOsName(): string {
  switch (process.platform) {
    case 'win32': return 'windows';
    case 'darwin': return 'osx';
    default: return 'linux';
  }
}

function mavenToPath(maven: string): string {
  const parts = maven.split(':');
  const group = parts[0].replace(/\./g, '/');
  const artifact = parts[1];
  const version = parts[2];
  return `${group}/${artifact}/${version}/${artifact}-${version}.jar`;
}
