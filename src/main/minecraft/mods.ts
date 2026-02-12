import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import fetch from 'node-fetch';
import { getModsDir } from '../utils/paths';
import { getApiUrl } from '../auth/auth-manager';

export interface ModInfo {
  fileName: string;
  enabled: boolean;
  size: number;
}

interface ServerMod {
  fileName: string;
  size: number;
  md5: string;
}

export function getModsList(): ModInfo[] {
  const modsDir = getModsDir();
  if (!fs.existsSync(modsDir)) return [];

  const files = fs.readdirSync(modsDir);
  return files
    .filter((f) => f.endsWith('.jar') || f.endsWith('.jar.disabled'))
    .map((fileName) => {
      const filePath = path.join(modsDir, fileName);
      const stats = fs.statSync(filePath);
      return {
        fileName: fileName.replace('.disabled', ''),
        enabled: !fileName.endsWith('.disabled'),
        size: stats.size,
      };
    });
}

export async function syncMods(
  onProgress: (percent: number, status: string) => void
): Promise<void> {
  const apiUrl = getApiUrl();
  const modsDir = getModsDir();

  onProgress(0, 'Получаю список модов с сервера...');

  // 1. Fetch server mod list
  const response = await fetch(`${apiUrl}/api/mods`);
  if (!response.ok) {
    throw new Error('Не удалось получить список модов с сервера');
  }
  const serverMods = (await response.json()) as ServerMod[];

  onProgress(10, `Найдено ${serverMods.length} модов на сервере`);

  // 2. Compare with local mods and determine what to download
  const toDownload: ServerMod[] = [];
  const serverFileNames = new Set(serverMods.map((m) => m.fileName));

  for (const serverMod of serverMods) {
    const localPath = path.join(modsDir, serverMod.fileName);
    if (!fs.existsSync(localPath)) {
      toDownload.push(serverMod);
    } else {
      // Compare MD5
      const localMd5 = computeLocalMd5(localPath);
      if (localMd5 !== serverMod.md5) {
        toDownload.push(serverMod);
      }
    }
  }

  // 3. Remove local mods not on server
  const localFiles = fs.readdirSync(modsDir).filter((f) => f.endsWith('.jar'));
  for (const localFile of localFiles) {
    if (!serverFileNames.has(localFile)) {
      fs.unlinkSync(path.join(modsDir, localFile));
    }
  }
  // Also clean up disabled mods not on server
  const disabledFiles = fs.readdirSync(modsDir).filter((f) => f.endsWith('.jar.disabled'));
  for (const disabledFile of disabledFiles) {
    const originalName = disabledFile.replace('.disabled', '');
    if (!serverFileNames.has(originalName)) {
      fs.unlinkSync(path.join(modsDir, disabledFile));
    }
  }

  if (toDownload.length === 0) {
    onProgress(100, 'Все моды актуальны!');
    return;
  }

  // 4. Download missing/outdated mods
  let downloaded = 0;
  for (const mod of toDownload) {
    const percent = 10 + Math.floor((downloaded / toDownload.length) * 85);
    onProgress(percent, `Скачиваю ${mod.fileName}...`);

    const modUrl = `${apiUrl}/api/mods/${encodeURIComponent(mod.fileName)}/download`;
    const modResponse = await fetch(modUrl);
    if (!modResponse.ok) {
      throw new Error(`Ошибка скачивания мода: ${mod.fileName}`);
    }

    const destPath = path.join(modsDir, mod.fileName);
    const fileStream = fs.createWriteStream(destPath);

    await new Promise<void>((resolve, reject) => {
      modResponse.body!.pipe(fileStream);
      fileStream.on('finish', resolve);
      fileStream.on('error', reject);
    });

    downloaded++;
  }

  onProgress(100, `Синхронизировано! Скачано ${downloaded} модов.`);
}

function computeLocalMd5(filePath: string): string {
  const data = fs.readFileSync(filePath);
  return crypto.createHash('md5').update(data).digest('hex');
}

export function toggleMod(fileName: string, enabled: boolean): void {
  const modsDir = getModsDir();
  const enabledPath = path.join(modsDir, fileName);
  const disabledPath = path.join(modsDir, fileName + '.disabled');

  if (enabled && fs.existsSync(disabledPath)) {
    fs.renameSync(disabledPath, enabledPath);
  } else if (!enabled && fs.existsSync(enabledPath)) {
    fs.renameSync(enabledPath, disabledPath);
  }
}

export function deleteMod(fileName: string): void {
  const modsDir = getModsDir();
  const enabledPath = path.join(modsDir, fileName);
  const disabledPath = path.join(modsDir, fileName + '.disabled');

  if (fs.existsSync(enabledPath)) fs.unlinkSync(enabledPath);
  if (fs.existsSync(disabledPath)) fs.unlinkSync(disabledPath);
}

export function addMod(sourcePath: string): void {
  const modsDir = getModsDir();
  const fileName = path.basename(sourcePath);
  const destPath = path.join(modsDir, fileName);
  fs.copyFileSync(sourcePath, destPath);
}

export function openModsFolder(): void {
  const modsDir = getModsDir();
  const { shell } = require('electron');
  shell.openPath(modsDir);
}
