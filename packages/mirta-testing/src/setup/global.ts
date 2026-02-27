/**
 * @file Конфигурационный файл для настройки глобальных моков в тестах.
 *
 * Этот файл:
 * - Выполняется перед каждым тестовым файлом через `setupFiles` в конфигурации Vitest;
 * - Заменяет заглушками отсутствующие конструкции движка `wb-rules`;
 *
 * Позволяет:
 * - Тестировать логику без реального оборудования;
 *
 * @see https://vitest.dev/config/#setupfiles
 *
 * @since 0.4.0
 *
 **/

import { vi } from 'vitest';
import { mock } from 'vitest-mock-extended';

/**
 * Создаёт базовый логгер с моками методов журналирования.
 * @returns Типизированный мок логгера с методами `info`, `debug`, `warning`, `error`.
 *
 **/
const createLogger = () => {

  const logger = vi.fn() as unknown as WbRules.Log;

  logger.info = vi.fn();
  logger.debug = vi.fn();
  logger.warning = vi.fn();
  logger.error = vi.fn();

  return logger;

};

// Мок модуля NodeJs.
global.module = mock<NodeJS.Module>();

// Мок логгера для тестирования.
global.log = createLogger();

// Мок отладочного логирования (алиас для `log.debug`).
global.debug = vi.fn() as WbRules.Debug;

// Мок виртуального устройства.
global.dev = mock<WbRules.Dev>();

// Мок создания виртуальных устройств.
global.defineVirtualDevice = vi.fn();

// Мок получения устройства.
global.getDevice = vi.fn(() => mock<WbRules.Device>({
  getControl: () => mock<WbRules.Control>(),
}));

// Мок получения контрола устройства.
global.getControl = vi.fn();

// Мок отслеживания MQTT-сообщений.
global.trackMqtt = vi.fn();

// Мок определения правил.
global.defineRule = vi.fn();

// Мок отключения правила.
global.disableRule = vi.fn();

// Мок включения правила.
global.enableRule = vi.fn();

// Мок запуска правила.
global.runRule = vi.fn();

// Мок сервиса уведомлений.
global.Notify = mock<WbRules.Notify>();

// Мок сервиса оповещения.
global.Alarms = mock<WbRules.Alarms>();

// Мок таймеров.
global.timers = {};

// Мок стартера однократного таймера.
global.startTimer = vi.fn();

// Мок стартера периодического таймера.
global.startTicker = vi.fn();

// Реализация String.prototype.format для тестов
String.prototype.format = function (...args: (string | number | boolean)[]): string {

  let result = '';
  let argIndex = 0;
  const str = this as string;

  // Шаг 1: парсим строку, заменяя {} и обрабатывая {{, }}
  for (let i = 0; i < str.length; i++) {

    if (str[i] === '{' && str[i + 1] === '{') {

      result += '{';
      i++;
      continue;

    }
    if (str[i] === '}' && str[i + 1] === '}') {

      result += '}';
      i++;
      continue;

    }
    if (str[i] === '{' && str[i + 1] === '}') {

      result += argIndex < args.length ? String(args[argIndex++]) : '';
      i++;
      continue;

    }
    result += str[i];

  }

  // Шаг 2: добавляем лишние аргументы
  if (argIndex < args.length) {

    const rest = args.slice(argIndex).map(String).join(' ');
    // Всегда добавляем пробел перед rest, даже если строка пустая
    result += ' ' + rest;

  }

  return result;

};

String.prototype.xformat = function () {

  throw new Error(
    'string.xformat() is not allowed in tests. '
    + 'Use string.format() or mock the result'
  );

};
