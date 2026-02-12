/**
 * Централизованная конфигурация Minecraft и Fabric
 */

export const MINECRAFT_CONFIG = {
  // Версия Minecraft
  version: '1.21.11',

  // Адрес сервера для автоподключения
  serverAddress: 'spa.ado-dokidokihimitsukichi-daigakuimo.ru',

  // API сервер для загрузки ресурсов
  apiServer: 'http://93.123.84.190:3000',

  // Использовать локальный API вместо Mojang серверов
  // true = быстрая загрузка с вашего сервера
  // false = стандартная загрузка с Mojang
  useLocalResources: true,

  // Fabric Loader настройки
  fabric: {
    // Если null - загружается последняя версия
    // Если указать конкретную версию (например, '0.15.11') - загрузится она
    loaderVersion: '0.18.4',
  },
};

/**
 * Доступные версии Minecraft:
 * - 1.21.1 (рекомендуется)
 * - 1.21
 * - 1.20.6
 * - 1.20.4
 * - 1.20.2
 * - 1.20.1
 * - 1.19.4
 * - и т.д.
 *
 * Полный список: https://meta.fabricmc.net/v2/versions/game
 */

/**
 * Доступные версии Fabric Loader для MC 1.21.1:
 * Проверьте: https://meta.fabricmc.net/v2/versions/loader/1.21.1
 *
 * Примеры:
 * - 0.16.9 (последняя на момент создания)
 * - 0.16.5
 * - 0.15.11
 */
