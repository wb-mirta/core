import { defineConfig } from './config';
import { DEFAULT_SSH_HOSTNAME, DEFAULT_SSH_USERNAME } from './constants';
import type { DeployFrom, DeployTo } from './types';

/**
 * Экспортируемая конфигурация по умолчанию (zero-config).
 *
 * Содержит:
 * - Подключение `default` по SSH к стандартному адресу
 * - Профиль деплоя `default`, использующий это подключение
 * - Маппинг `wb-rules-es5` для синхронизации скомпилированных модулей и правил wb-rules
 *
 * @since 0.4.0
 *
 **/
export default defineConfig({

  /**
   * Список подключений по умолчанию.
   *
   * Содержит одно соединение `default`,
   * соответствующее контроллеру Wiren Board в Debug-режиме (подключение USB-кабелем).
   *
   **/
  connections: {
    'default': `ssh://${DEFAULT_SSH_USERNAME}@${DEFAULT_SSH_HOSTNAME}`,
  },

  deploy: {
    /**
     * Предустановленные маппинги файлов.
     *
     * Маппинг 'wb-rules-es5' включает:
     * - Синхронизацию модулей wb-rules
     * - Синхронизацию скриптов wb-rules
     * - Защиту файла alarms.conf от удаления
     * - Очистку лишних файлов на контроллере (cleanup: true)
     *
     **/
    mappings: {
      'wb-rules-es5': [
        {
          from: 'dist/es5/wb-rules-modules/' as DeployFrom,
          to: '/mnt/data/etc/wb-rules-modules/' as DeployTo,

          cleanup: true,
        },
        {
          from: 'dist/es5/wb-rules/' as DeployFrom,
          to: '/mnt/data/etc/wb-rules/' as DeployTo,

          cleanup: true,
          protect: ['alarms.conf'],
        },
      ],
    },

    /**
     * Профили деплоя по умолчанию.
     *
     * Профиль 'default':
     * - Использует подключение 'default'
     * - Применяет маппинг 'wb-rules-es5'
     *
     **/
    profiles: {
      default: {
        connection: 'default',
        mappings: ['wb-rules-es5'],
      },
    },
  },

});
