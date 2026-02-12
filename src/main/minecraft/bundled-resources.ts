import fs from 'fs';
import path from 'path';
import { app } from 'electron';
import { getMinecraftDir, getAssetsDir, getLibrariesDir, getVersionsDir, getModsDir } from '../utils/paths';
import { MINECRAFT_CONFIG } from './config';

/**
 * Путь к встроенным ресурсам в установленном лаунчере
 */
function getBundledResourcesPath(): string {
  if (app.isPackaged) {
    // Production - ресурсы в process.resourcesPath
    return path.join(process.resourcesPath, 'minecraft');
  } else {
    // Development - ресурсы в папке проекта
    return path.join(__dirname, '..', '..', '..', 'resources', 'minecraft');
  }
}

/**
 * Проверяет наличие встроенных ресурсов
 */
export function hasBundledResources(): boolean {
  const bundledPath = getBundledResourcesPath();
  const versionPath = path.join(bundledPath, 'versions', MINECRAFT_CONFIG.version);

  return fs.existsSync(versionPath);
}

/**
 * Копирует встроенные ресурсы в .minecraft
 */
export async function copyBundledResources(
  onProgress: (percent: number, status: string) => void
): Promise<void> {
  const bundledPath = getBundledResourcesPath();

  if (!fs.existsSync(bundledPath)) {
    throw new Error('Встроенные ресурсы не найдены');
  }

  onProgress(0, 'Подготовка встроенных ресурсов...');

  const sources = {
    assets: path.join(bundledPath, 'assets'),
    libraries: path.join(bundledPath, 'libraries'),
    versions: path.join(bundledPath, 'versions', MINECRAFT_CONFIG.version),
    mods: path.join(bundledPath, 'mods'),
  };

  const destinations = {
    assets: getAssetsDir(),
    libraries: getLibrariesDir(),
    versions: path.join(getVersionsDir(), MINECRAFT_CONFIG.version),
    mods: getModsDir(),
  };

  // Подсчет файлов
  const countFiles = (dir: string): number => {
    if (!fs.existsSync(dir)) return 0;
    const stats = fs.statSync(dir);
    if (stats.isFile()) return 1;

    let count = 0;
    const files = fs.readdirSync(dir);
    for (const file of files) {
      count += countFiles(path.join(dir, file));
    }
    return count;
  };

  const totalFiles =
    countFiles(sources.assets) +
    countFiles(sources.libraries) +
    countFiles(sources.versions) +
    countFiles(sources.mods);

  let copiedFiles = 0;

  // Копирование с прогрессом
  const copyRecursive = (src: string, dest: string) => {
    if (!fs.existsSync(src)) return;

    const stats = fs.statSync(src);

    if (stats.isDirectory()) {
      fs.mkdirSync(dest, { recursive: true });
      const files = fs.readdirSync(src);

      for (const file of files) {
        copyRecursive(path.join(src, file), path.join(dest, file));
      }
    } else {
      // Пропускаем если файл уже существует
      if (fs.existsSync(dest)) {
        copiedFiles++;
        return;
      }

      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.copyFileSync(src, dest);
      copiedFiles++;

      // Обновляем прогресс каждые 50 файлов
      if (copiedFiles % 50 === 0 || copiedFiles === totalFiles) {
        const percent = Math.floor((copiedFiles / totalFiles) * 100);
        onProgress(percent, `Копирование ресурсов... ${copiedFiles}/${totalFiles}`);
      }
    }
  };

  onProgress(5, 'Копирование ассетов...');
  copyRecursive(sources.assets, destinations.assets);

  onProgress(40, 'Копирование библиотек...');
  copyRecursive(sources.libraries, destinations.libraries);

  onProgress(70, 'Копирование версии...');
  copyRecursive(sources.versions, destinations.versions);

  onProgress(90, 'Копирование модов...');
  copyRecursive(sources.mods, destinations.mods);

  onProgress(100, 'Встроенные ресурсы скопированы!');
}

/**
 * Проверяет нужно ли копировать встроенные ресурсы
 */
export function needsBundledResourcesCopy(): boolean {
  // Проверяем наличие клиента
  const clientJar = path.join(
    getVersionsDir(),
    MINECRAFT_CONFIG.version,
    `${MINECRAFT_CONFIG.version}.jar`
  );

  return !fs.existsSync(clientJar);
}
