import path from 'path';
import { app } from 'electron';
import fs from 'fs';

export function getLauncherDir(): string {
  const dir = path.join(app.getPath('appData'), '.spa-launcher');
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

export function getMinecraftDir(): string {
  const dir = path.join(getLauncherDir(), 'minecraft');
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

export function getVersionsDir(): string {
  const dir = path.join(getMinecraftDir(), 'versions');
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

export function getLibrariesDir(): string {
  const dir = path.join(getMinecraftDir(), 'libraries');
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

export function getAssetsDir(): string {
  const dir = path.join(getMinecraftDir(), 'assets');
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

export function getModsDir(): string {
  const dir = path.join(getMinecraftDir(), 'mods');
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

export function getNativesDir(): string {
  const dir = path.join(getMinecraftDir(), 'natives');
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

export function getJavaDir(): string {
  const dir = path.join(getLauncherDir(), 'java');
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}
