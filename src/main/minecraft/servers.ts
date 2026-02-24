import fs from 'fs';
import path from 'path';
import nbt from 'prismarine-nbt';
import { getMinecraftDir } from '../utils/paths';
import { MINECRAFT_CONFIG } from './config';

/**
 * Создаёт файл servers.dat с сервером для автоподключения
 */
export function createServersFile(): void {
  const minecraftDir = getMinecraftDir();
  const serversPath = path.join(minecraftDir, 'servers.dat');

  // Парсим адрес сервера
  const parts = MINECRAFT_CONFIG.serverAddress.split(':');
  const serverIp = parts[0];
  const serverPort = parts.length > 1 ? parts[1] : '25565';

  // Создаём NBT структуру для servers.dat
  const serversData = {
    type: 'compound',
    name: '',
    value: {
      servers: {
        type: 'list',
        value: {
          type: 'compound',
          value: [
            {
              name: {
                type: 'string',
                value: 'SP.A Server',
              },
              ip: {
                type: 'string',
                value: MINECRAFT_CONFIG.serverAddress,
              },
              icon: {
                type: 'string',
                value: '',
              },
            },
          ],
        },
      },
    },
  };

  // Записываем в формате NBT (big endian, gzip compressed)
  const buffer = nbt.writeUncompressed(serversData as any, 'big');

  // Minecraft использует gzip сжатие для servers.dat
  const zlib = require('zlib');
  const compressed = zlib.gzipSync(buffer);

  fs.writeFileSync(serversPath, compressed);
}

/**
 * Проверяет наличие servers.dat файла
 */
export function hasServersFile(): boolean {
  const serversPath = path.join(getMinecraftDir(), 'servers.dat');
  return fs.existsSync(serversPath);
}
