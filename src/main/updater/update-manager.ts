import { BrowserWindow, shell } from 'electron';
import { app } from 'electron';
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { spawn } from 'child_process';
import { MINECRAFT_CONFIG } from '../minecraft/config';

export interface UpdateInfo {
  updateAvailable: boolean;
  version?: string;
  releaseDate?: string;
  changelog?: string[];
  required?: boolean;
  type?: 'launcher-only' | 'full';
  downloadUrl?: string;
  fileSize?: number;
}

export interface DownloadProgress {
  percent: number;
  downloaded: number;
  total: number;
}

export class UpdateManager {
  private mainWindow: BrowserWindow | null = null;
  private downloadingUpdate = false;
  private downloadedFilePath: string | null = null;

  setMainWindow(window: BrowserWindow) {
    this.mainWindow = window;
  }

  /**
   * Проверить наличие обновлений
   */
  async checkForUpdates(): Promise<UpdateInfo> {
    try {
      const currentVersion = app.getVersion();
      const apiUrl = MINECRAFT_CONFIG.apiServer;

      console.log(`Проверка обновлений: текущая версия ${currentVersion}`);

      const response = await fetch(`${apiUrl}/api/updates/check?version=${currentVersion}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json() as UpdateInfo;

      if (data.updateAvailable) {
        console.log(`Доступно обновление: ${data.version} (тип: ${data.type || 'full'})`);
        this.sendToRenderer('update-available', data);
      } else {
        console.log('Обновлений не найдено');
        this.sendToRenderer('update-not-available');
      }

      return data;
    } catch (error) {
      console.error('Ошибка проверки обновлений:', error);
      this.sendToRenderer('update-error', {
        message: error instanceof Error ? error.message : 'Неизвестная ошибка'
      });
      throw error;
    }
  }

  /**
   * Скачать обновление
   */
  async downloadUpdate(downloadUrl: string): Promise<string> {
    if (this.downloadingUpdate) {
      throw new Error('Обновление уже скачивается');
    }

    this.downloadingUpdate = true;

    try {
      console.log(`Скачивание обновления: ${downloadUrl}`);

      const response = await fetch(downloadUrl);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const totalSize = parseInt(response.headers.get('content-length') || '0', 10);
      let downloadedSize = 0;

      // Создаем временную директорию для обновлений
      const tempDir = path.join(app.getPath('temp'), 'spa-launcher-updates');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      // Определяем имя файла
      const fileName = path.basename(downloadUrl);
      const filePath = path.join(tempDir, fileName);

      // Удаляем старый файл, если существует
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      const fileStream = fs.createWriteStream(filePath);

      return new Promise<string>((resolve, reject) => {
        if (!response.body) {
          reject(new Error('Response body is null'));
          return;
        }

        response.body.on('data', (chunk: Buffer) => {
          downloadedSize += chunk.length;

          const progress: DownloadProgress = {
            percent: totalSize > 0 ? (downloadedSize / totalSize) * 100 : 0,
            downloaded: downloadedSize,
            total: totalSize
          };

          this.sendToRenderer('update-download-progress', progress);
        });

        response.body.pipe(fileStream);

        fileStream.on('finish', () => {
          fileStream.close();
          this.downloadingUpdate = false;
          this.downloadedFilePath = filePath;

          console.log(`Обновление скачано: ${filePath}`);
          this.sendToRenderer('update-downloaded', { filePath });

          resolve(filePath);
        });

        fileStream.on('error', (error) => {
          this.downloadingUpdate = false;
          fs.unlink(filePath, () => {}); // Удаляем поврежденный файл

          console.error('Ошибка скачивания обновления:', error);
          this.sendToRenderer('update-error', { message: error.message });

          reject(error);
        });
      });
    } catch (error) {
      this.downloadingUpdate = false;
      console.error('Ошибка скачивания обновления:', error);
      this.sendToRenderer('update-error', {
        message: error instanceof Error ? error.message : 'Неизвестная ошибка'
      });
      throw error;
    }
  }

  /**
   * Установить обновление.
   * Если скачанный файл — .asar, применяется launcher-only обновление через bat-скрипт.
   * Если .exe — запускается полный установщик как раньше.
   */
  installUpdate(filePath?: string): void {
    const updateFile = filePath || this.downloadedFilePath;

    if (!updateFile) {
      throw new Error('Файл обновления не найден');
    }

    if (!fs.existsSync(updateFile)) {
      throw new Error('Файл обновления не существует');
    }

    if (path.extname(updateFile).toLowerCase() === '.asar') {
      this.installAsarUpdate(updateFile);
    } else {
      this.installFullUpdate(updateFile);
    }
  }

  /**
   * Launcher-only обновление: заменяет app.asar через bat-скрипт и перезапускает лаунчер.
   * Minecraft-файлы не затрагиваются.
   */
  private installAsarUpdate(newAsarPath: string): void {
    const currentAsarPath = path.join(process.resourcesPath, 'app.asar');
    const exePath = app.getPath('exe');

    const tempDir = path.dirname(newAsarPath);
    const batchPath = path.join(tempDir, 'spa-update.bat');

    const batchContent = [
      '@echo off',
      'timeout /t 2 /nobreak > nul',
      `move /y "${newAsarPath}" "${currentAsarPath}"`,
      `start "" "${exePath}"`,
    ].join('\r\n');

    console.log(`Применение launcher-only обновления: ${newAsarPath} -> ${currentAsarPath}`);

    fs.writeFileSync(batchPath, batchContent, 'utf-8');

    spawn('cmd.exe', ['/c', batchPath], { detached: true, stdio: 'ignore' }).unref();

    setTimeout(() => app.quit(), 500);
  }

  /**
   * Полное обновление: запускает установщик и закрывает лаунчер.
   */
  private installFullUpdate(installerPath: string): void {
    console.log(`Запуск установщика: ${installerPath}`);

    shell.openPath(installerPath).then((error) => {
      if (error) {
        console.error('Ошибка запуска установщика:', error);
        this.sendToRenderer('update-error', { message: error });
      } else {
        setTimeout(() => app.quit(), 1000);
      }
    });
  }

  /**
   * Проверить обязательное ли обновление и заблокировать приложение если нужно
   */
  async checkAndEnforceUpdate(): Promise<boolean> {
    try {
      const updateInfo = await this.checkForUpdates();

      if (updateInfo.updateAvailable && updateInfo.required) {
        console.log('Обнаружено обязательное обновление');
        this.sendToRenderer('update-required', updateInfo);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Ошибка проверки обязательного обновления:', error);
      return false;
    }
  }

  /**
   * Отправить событие в renderer процесс
   */
  private sendToRenderer(channel: string, data?: any) {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send(channel, data);
    }
  }
}

// Singleton экземпляр
export const updateManager = new UpdateManager();
