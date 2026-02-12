import path from 'path';
import fs from 'fs';
import { exec } from 'child_process';
import { getJavaDir } from './paths';
import fetch from 'node-fetch';
import AdmZip from 'adm-zip';

const ADOPTIUM_API = 'https://api.adoptium.net/v3/assets/latest/21/hotspot';

export async function findJava(): Promise<string | null> {
  // Check bundled Java first
  const bundledJava = getBundledJavaPath();
  if (bundledJava && fs.existsSync(bundledJava)) {
    return bundledJava;
  }

  // Check JAVA_HOME
  const javaHome = process.env.JAVA_HOME;
  if (javaHome) {
    const javaExe = path.join(javaHome, 'bin', process.platform === 'win32' ? 'java.exe' : 'java');
    if (fs.existsSync(javaExe)) {
      return javaExe;
    }
  }

  // Check PATH
  return new Promise((resolve) => {
    const cmd = process.platform === 'win32' ? 'where java' : 'which java';
    exec(cmd, (err, stdout) => {
      if (err || !stdout.trim()) {
        resolve(null);
      } else {
        resolve(stdout.trim().split('\n')[0].trim());
      }
    });
  });
}

function getBundledJavaPath(): string | null {
  const javaDir = getJavaDir();
  const entries = fs.existsSync(javaDir) ? fs.readdirSync(javaDir) : [];

  for (const entry of entries) {
    const binDir = path.join(javaDir, entry, 'bin');
    const javaExe = path.join(binDir, process.platform === 'win32' ? 'java.exe' : 'java');
    if (fs.existsSync(javaExe)) {
      return javaExe;
    }
  }
  return null;
}

export async function downloadJava(
  onProgress: (percent: number, status: string) => void
): Promise<string> {
  onProgress(0, 'Определяю платформу...');

  const os = process.platform === 'win32' ? 'windows' : process.platform === 'darwin' ? 'mac' : 'linux';
  const arch = process.arch === 'x64' ? 'x64' : 'aarch64';

  const url = `${ADOPTIUM_API}?architecture=${arch}&image_type=jre&os=${os}&vendor=eclipse`;

  onProgress(5, 'Получаю информацию о Java...');
  const response = await fetch(url);
  const data = (await response.json()) as any[];

  if (!data || data.length === 0) {
    throw new Error('Не удалось найти Java для вашей платформы');
  }

  const binary = data[0].binary;
  const downloadUrl = binary.package.link;
  const fileName = binary.package.name;

  onProgress(10, 'Скачиваю Java...');

  const javaDir = getJavaDir();
  const archivePath = path.join(javaDir, fileName);

  const downloadResponse = await fetch(downloadUrl);
  if (!downloadResponse.ok || !downloadResponse.body) {
    throw new Error('Ошибка скачивания Java');
  }

  const totalSize = Number(downloadResponse.headers.get('content-length')) || 0;
  let downloadedSize = 0;

  const fileStream = fs.createWriteStream(archivePath);

  await new Promise<void>((resolve, reject) => {
    downloadResponse.body!.on('data', (chunk: Buffer) => {
      downloadedSize += chunk.length;
      if (totalSize > 0) {
        const percent = 10 + Math.floor((downloadedSize / totalSize) * 70);
        onProgress(percent, `Скачиваю Java... ${Math.floor(downloadedSize / 1024 / 1024)}MB`);
      }
    });
    downloadResponse.body!.pipe(fileStream);
    fileStream.on('finish', resolve);
    fileStream.on('error', reject);
  });

  onProgress(85, 'Распаковываю Java...');

  if (fileName.endsWith('.zip')) {
    const zip = new AdmZip(archivePath);
    zip.extractAllTo(javaDir, true);
  } else {
    // tar.gz - use system tar
    await new Promise<void>((resolve, reject) => {
      exec(`tar -xzf "${archivePath}" -C "${javaDir}"`, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  fs.unlinkSync(archivePath);

  onProgress(95, 'Проверяю Java...');

  const javaPath = getBundledJavaPath();
  if (!javaPath) {
    throw new Error('Не удалось найти Java после распаковки');
  }

  onProgress(100, 'Java установлена!');
  return javaPath;
}
