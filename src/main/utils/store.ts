import fs from 'fs';
import path from 'path';
import { app } from 'electron';

const STORE_PATH = path.join(app.getPath('appData'), '.spa-launcher', 'config.json');

function ensureDir(): void {
  const dir = path.dirname(STORE_PATH);
  fs.mkdirSync(dir, { recursive: true });
}

function readStore(): Record<string, any> {
  try {
    if (fs.existsSync(STORE_PATH)) {
      return JSON.parse(fs.readFileSync(STORE_PATH, 'utf-8'));
    }
  } catch {
    // corrupt file, reset
  }
  return {};
}

function writeStore(data: Record<string, any>): void {
  ensureDir();
  fs.writeFileSync(STORE_PATH, JSON.stringify(data, null, 2));
}

export function storeGet<T>(key: string, defaultValue: T): T {
  const data = readStore();
  return key in data ? data[key] : defaultValue;
}

export function storeSet(key: string, value: any): void {
  const data = readStore();
  data[key] = value;
  writeStore(data);
}
