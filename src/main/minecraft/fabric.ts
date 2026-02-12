import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';
import { getVersionsDir, getLibrariesDir } from '../utils/paths';
import { MINECRAFT_CONFIG } from './config';

const FABRIC_META_URL = 'https://meta.fabricmc.net/v2';
const MC_VERSION = MINECRAFT_CONFIG.version;

interface ProgressCallback {
  (percent: number, status: string): void;
}

export async function installFabric(onProgress: ProgressCallback): Promise<void> {
  onProgress(0, 'Получаю информацию о Fabric...');

  // 1. Get Fabric loader version
  let loaderVersion: string;

  if (MINECRAFT_CONFIG.fabric.loaderVersion) {
    // Используем указанную версию
    loaderVersion = MINECRAFT_CONFIG.fabric.loaderVersion;
    onProgress(5, `Используется Fabric Loader ${loaderVersion}...`);
  } else {
    // Загружаем последнюю версию
    const loadersRes = await fetch(`${FABRIC_META_URL}/versions/loader/${MC_VERSION}`);
    const loaders = (await loadersRes.json()) as any[];

    if (!loaders || loaders.length === 0) {
      throw new Error(`Fabric Loader не найден для версии ${MC_VERSION}`);
    }

    const latestLoader = loaders[0];
    loaderVersion = latestLoader.loader.version;
    onProgress(5, `Используется последняя версия Fabric Loader ${loaderVersion}...`);
  }

  onProgress(10, `Устанавливаю Fabric Loader ${loaderVersion}...`);

  // 2. Get Fabric profile JSON
  const profileRes = await fetch(
    `${FABRIC_META_URL}/versions/loader/${MC_VERSION}/${loaderVersion}/profile/json`
  );
  const fabricProfile = (await profileRes.json()) as any;

  // 3. Save Fabric version JSON
  const fabricVersionId = fabricProfile.id;
  const fabricVersionDir = path.join(getVersionsDir(), fabricVersionId);
  fs.mkdirSync(fabricVersionDir, { recursive: true });
  fs.writeFileSync(
    path.join(fabricVersionDir, `${fabricVersionId}.json`),
    JSON.stringify(fabricProfile, null, 2)
  );

  // 4. Download Fabric libraries
  const libraries = fabricProfile.libraries || [];
  const totalLibs = libraries.length;
  let downloadedLibs = 0;

  for (const lib of libraries) {
    const libPath = mavenToPath(lib.name);
    const fullPath = path.join(getLibrariesDir(), libPath);

    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(path.dirname(fullPath), { recursive: true });

      const libUrl = lib.url
        ? lib.url + libPath
        : `https://maven.fabricmc.net/${libPath}`;

      try {
        const response = await fetch(libUrl);
        if (!response.ok) {
          // Try Maven Central as fallback
          const centralUrl = `https://repo1.maven.org/maven2/${libPath}`;
          const centralRes = await fetch(centralUrl);
          if (!centralRes.ok) {
            console.warn(`Failed to download library: ${lib.name}`);
            downloadedLibs++;
            continue;
          }
          const buffer = await centralRes.buffer();
          fs.writeFileSync(fullPath, buffer);
        } else {
          const buffer = await response.buffer();
          fs.writeFileSync(fullPath, buffer);
        }
      } catch (err) {
        console.warn(`Error downloading ${lib.name}:`, err);
      }
    }

    downloadedLibs++;
    const percent = 10 + Math.floor((downloadedLibs / totalLibs) * 85);
    onProgress(percent, `Скачиваю библиотеки Fabric... ${downloadedLibs}/${totalLibs}`);
  }

  onProgress(100, 'Fabric установлен!');
}

export function isFabricInstalled(): boolean {
  const versionsDir = getVersionsDir();
  if (!fs.existsSync(versionsDir)) return false;

  const entries = fs.readdirSync(versionsDir);
  return entries.some((entry) => entry.startsWith('fabric-loader'));
}

export function getFabricVersionId(): string | null {
  const versionsDir = getVersionsDir();
  if (!fs.existsSync(versionsDir)) return null;

  const entries = fs.readdirSync(versionsDir);
  const fabricDir = entries.find((entry) => entry.startsWith('fabric-loader'));
  return fabricDir || null;
}

export function getFabricProfile(): any | null {
  const versionId = getFabricVersionId();
  if (!versionId) return null;

  const profilePath = path.join(getVersionsDir(), versionId, `${versionId}.json`);
  if (!fs.existsSync(profilePath)) return null;

  return JSON.parse(fs.readFileSync(profilePath, 'utf-8'));
}

function mavenToPath(maven: string): string {
  const parts = maven.split(':');
  const group = parts[0].replace(/\./g, '/');
  const artifact = parts[1];
  const version = parts[2];
  return `${group}/${artifact}/${version}/${artifact}-${version}.jar`;
}
