/**
 * Скрипт подготовки ресурсов Minecraft для встраивания в лаунчер
 *
 * Запуск: node prepare-resources.js
 */

const fs = require('fs');
const path = require('path');

const MC_VERSION = '1.21.11'; // Ваша версия

// Источник - установленный Minecraft
const MINECRAFT_DIR = process.env.APPDATA
  ? path.join(process.env.APPDATA, '.minecraft')
  : path.join(process.env.HOME, '.minecraft');

// Назначение - ресурсы лаунчера
const RESOURCES_DIR = path.join(__dirname, 'resources', 'minecraft');

console.log('📦 Подготовка встроенных ресурсов Minecraft\n');
console.log(`Версия: ${MC_VERSION}`);
console.log(`Источник: ${MINECRAFT_DIR}`);
console.log(`Назначение: ${RESOURCES_DIR}\n`);

// Структура источника
const SOURCE = {
  assets: path.join(MINECRAFT_DIR, 'assets'),
  libraries: path.join(MINECRAFT_DIR, 'libraries'),
  versions: path.join(MINECRAFT_DIR, 'versions', MC_VERSION),
};

// Структура назначения
const DEST = {
  assets: path.join(RESOURCES_DIR, 'assets'),
  libraries: path.join(RESOURCES_DIR, 'libraries'),
  versions: path.join(RESOURCES_DIR, 'versions', MC_VERSION),
};

// Проверка наличия Minecraft
if (!fs.existsSync(SOURCE.versions)) {
  console.error(`❌ Версия ${MC_VERSION} не найдена!`);
  console.log(`\n💡 Путь: ${SOURCE.versions}`);
  console.log('\nУстановите через официальный лаунчер и запустите снова.\n');
  process.exit(1);
}

// Копирование
function copyRecursive(src, dest) {
  if (!fs.existsSync(src)) return 0;

  const stats = fs.statSync(src);

  if (stats.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    const files = fs.readdirSync(src);
    let total = 0;

    for (const file of files) {
      total += copyRecursive(path.join(src, file), path.join(dest, file));
    }

    return total;
  } else {
    if (fs.existsSync(dest)) return 0;

    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
    return 1;
  }
}

// Подсчет размера
function getSize(dir) {
  if (!fs.existsSync(dir)) return 0;
  const stats = fs.statSync(dir);
  if (stats.isFile()) return stats.size;

  let size = 0;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    size += getSize(path.join(dir, file));
  }
  return size;
}

console.log('⏳ Копирование файлов...\n');

console.log('📦 Ассеты...');
const assetsCount = copyRecursive(SOURCE.assets, DEST.assets);
console.log(`✅ Скопировано: ${assetsCount} файлов\n`);

console.log('📦 Библиотеки...');
const libsCount = copyRecursive(SOURCE.libraries, DEST.libraries);
console.log(`✅ Скопировано: ${libsCount} файлов\n`);

console.log('📦 Версия...');
const versionCount = copyRecursive(SOURCE.versions, DEST.versions);
console.log(`✅ Скопировано: ${versionCount} файлов\n`);

const totalSize = getSize(RESOURCES_DIR);
const sizeMB = (totalSize / 1024 / 1024).toFixed(2);

console.log('='.repeat(50));
console.log('🎉 Готово!');
console.log('='.repeat(50));
console.log(`Всего: ${assetsCount + libsCount + versionCount} файлов`);
console.log(`Размер: ${sizeMB} MB`);
console.log(`\nПуть: ${RESOURCES_DIR}\n`);

console.log('💡 Следующий шаг: npm run build && npm run dist');
console.log('   Ресурсы будут встроены в установщик!\n');
