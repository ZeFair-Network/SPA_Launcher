import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';
import { getVersionsDir, getLibrariesDir, getAssetsDir, getNativesDir } from '../utils/paths';
import AdmZip from 'adm-zip';
import { MINECRAFT_CONFIG } from './config';
import { hasBundledResources, copyBundledResources, needsBundledResourcesCopy } from './bundled-resources';

const VERSION_MANIFEST_URL = 'https://piston-meta.mojang.com/mc/game/version_manifest_v2.json';
const MC_VERSION = MINECRAFT_CONFIG.version;

interface ProgressCallback {
  (percent: number, status: string): void;
}

// Генерация URL для ресурсов (API или Mojang)
function getResourceUrl(type: 'asset' | 'library', path: string): string {
  if (MINECRAFT_CONFIG.useLocalResources) {
    // Используем локальный API сервер
    const apiBase = MINECRAFT_CONFIG.apiServer;
    switch (type) {
      case 'asset':
        // path = hash файла
        return `${apiBase}/api/minecraft/assets/${path}`;
      case 'library':
        // path = полный путь библиотеки
        return `${apiBase}/api/minecraft/libraries/${path}`;
    }
  } else {
    // Используем официальные Mojang серверы
    switch (type) {
      case 'asset':
        const subDir = path.substring(0, 2);
        return `https://resources.download.minecraft.net/${subDir}/${path}`;
      case 'library':
        return path; // URL уже содержится в метаданных Mojang
    }
  }
}

export async function downloadMinecraft(onProgress: ProgressCallback): Promise<void> {
  // Проверяем наличие встроенных ресурсов
  if (hasBundledResources() && needsBundledResourcesCopy()) {
    onProgress(0, 'Обнаружены встроенные ресурсы!');
    await copyBundledResources(onProgress);
    onProgress(100, 'Установка завершена!');
    return;
  }

  onProgress(0, 'Получаю список версий...');

  // 1. Get version manifest
  const manifestRes = await fetch(VERSION_MANIFEST_URL);
  const manifest = (await manifestRes.json()) as any;

  const versionEntry = manifest.versions.find((v: any) => v.id === MC_VERSION);
  if (!versionEntry) {
    throw new Error(`Версия ${MC_VERSION} не найдена`);
  }

  onProgress(5, `Загружаю данные версии ${MC_VERSION}...`);

  // 2. Get version JSON
  const versionRes = await fetch(versionEntry.url);
  const versionData = (await versionRes.json()) as any;

  const versionDir = path.join(getVersionsDir(), MC_VERSION);
  fs.mkdirSync(versionDir, { recursive: true });
  fs.writeFileSync(path.join(versionDir, `${MC_VERSION}.json`), JSON.stringify(versionData, null, 2));

  // 3. Download client jar
  onProgress(10, 'Скачиваю клиент Minecraft...');
  const clientUrl = versionData.downloads.client.url;
  const clientPath = path.join(versionDir, `${MC_VERSION}.jar`);

  if (!fs.existsSync(clientPath)) {
    await downloadFile(clientUrl, clientPath, (p) => {
      onProgress(10 + Math.floor(p * 20), 'Скачиваю клиент Minecraft...');
    });
  }

  // 4. Download libraries
  onProgress(30, 'Скачиваю библиотеки...');
  const libraries = versionData.libraries || [];
  const totalLibs = libraries.length;
  let downloadedLibs = 0;

  for (const lib of libraries) {
    if (!isLibraryAllowed(lib)) continue;

    if (lib.downloads?.artifact) {
      const artifact = lib.downloads.artifact;
      const libPath = path.join(getLibrariesDir(), artifact.path);
      if (!fs.existsSync(libPath)) {
        fs.mkdirSync(path.dirname(libPath), { recursive: true });
        const url = MINECRAFT_CONFIG.useLocalResources
          ? getResourceUrl('library', artifact.path)
          : artifact.url;
        await downloadFile(url, libPath);
      }
    }

    // Download natives
    if (lib.downloads?.classifiers) {
      const nativeKey = getNativeKey(lib);
      if (nativeKey && lib.downloads.classifiers[nativeKey]) {
        const native = lib.downloads.classifiers[nativeKey];
        const nativePath = path.join(getLibrariesDir(), native.path);
        if (!fs.existsSync(nativePath)) {
          fs.mkdirSync(path.dirname(nativePath), { recursive: true });
          const url = MINECRAFT_CONFIG.useLocalResources
            ? getResourceUrl('library', native.path)
            : native.url;
          await downloadFile(url, nativePath);
        }
        // Extract natives
        extractNatives(nativePath, lib.extract);
      }
    }

    downloadedLibs++;
    const percent = 30 + Math.floor((downloadedLibs / totalLibs) * 30);
    onProgress(percent, `Скачиваю библиотеки... ${downloadedLibs}/${totalLibs}`);
  }

  // 5. Download assets
  onProgress(60, 'Скачиваю ресурсы...');
  const assetIndexUrl = versionData.assetIndex.url;
  const assetIndexId = versionData.assetIndex.id;

  const indexesDir = path.join(getAssetsDir(), 'indexes');
  fs.mkdirSync(indexesDir, { recursive: true });
  const indexPath = path.join(indexesDir, `${assetIndexId}.json`);

  const assetIndexRes = await fetch(assetIndexUrl);
  const assetIndex = (await assetIndexRes.json()) as any;
  fs.writeFileSync(indexPath, JSON.stringify(assetIndex, null, 2));

  const objects = assetIndex.objects;
  const assetKeys = Object.keys(objects);
  const totalAssets = assetKeys.length;
  let downloadedAssets = 0;

  for (const key of assetKeys) {
    const hash = objects[key].hash;
    const subDir = hash.substring(0, 2);
    const objectDir = path.join(getAssetsDir(), 'objects', subDir);
    const objectPath = path.join(objectDir, hash);

    if (!fs.existsSync(objectPath)) {
      fs.mkdirSync(objectDir, { recursive: true });
      const assetUrl = getResourceUrl('asset', hash);
      await downloadFile(assetUrl, objectPath);
    }

    downloadedAssets++;
    if (downloadedAssets % 50 === 0 || downloadedAssets === totalAssets) {
      const percent = 60 + Math.floor((downloadedAssets / totalAssets) * 35);
      onProgress(percent, `Скачиваю ресурсы... ${downloadedAssets}/${totalAssets}`);
    }
  }

  onProgress(100, 'Minecraft установлен!');
}

export function isMinecraftInstalled(): boolean {
  const clientJar = path.join(getVersionsDir(), MC_VERSION, `${MC_VERSION}.jar`);
  return fs.existsSync(clientJar);
}

export function getVersionData(): any | null {
  const versionJson = path.join(getVersionsDir(), MC_VERSION, `${MC_VERSION}.json`);
  if (!fs.existsSync(versionJson)) return null;
  return JSON.parse(fs.readFileSync(versionJson, 'utf-8'));
}

function isLibraryAllowed(lib: any): boolean {
  if (!lib.rules) return true;

  let allowed = false;
  for (const rule of lib.rules) {
    if (rule.action === 'allow') {
      if (!rule.os) {
        allowed = true;
      } else if (rule.os.name === getOsName()) {
        allowed = true;
      }
    } else if (rule.action === 'disallow') {
      if (rule.os && rule.os.name === getOsName()) {
        allowed = false;
      }
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

function getNativeKey(lib: any): string | null {
  if (!lib.natives) return null;
  const osName = getOsName();
  return lib.natives[osName]?.replace('${arch}', process.arch === 'x64' ? '64' : '32') || null;
}

function extractNatives(nativePath: string, extract?: { exclude?: string[] }): void {
  try {
    const zip = new AdmZip(nativePath);
    const nativesDir = getNativesDir();
    const entries = zip.getEntries();

    for (const entry of entries) {
      if (extract?.exclude?.some((ex) => entry.entryName.startsWith(ex))) {
        continue;
      }
      if (!entry.isDirectory) {
        zip.extractEntryTo(entry, nativesDir, false, true);
      }
    }
  } catch {
    // Ignore extraction errors for non-zip natives
  }
}

async function downloadFile(
  url: string,
  dest: string,
  onProgress?: (percent: number) => void
): Promise<void> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download: ${url} (${response.status})`);
  }

  const totalSize = Number(response.headers.get('content-length')) || 0;
  let downloaded = 0;

  const fileStream = fs.createWriteStream(dest);

  return new Promise((resolve, reject) => {
    response.body!.on('data', (chunk: Buffer) => {
      downloaded += chunk.length;
      if (onProgress && totalSize > 0) {
        onProgress(downloaded / totalSize);
      }
    });
    response.body!.pipe(fileStream);
    fileStream.on('finish', resolve);
    fileStream.on('error', reject);
    response.body!.on('error', reject);
  });
}
