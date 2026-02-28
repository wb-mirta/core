import { loadEnv as _loadEnv } from '@mirta/env-loader';

let isLoaded = false;

/**
 * Загружает переменные окружения из .env-файлов в проекте.
 *
 * Выполняется только один раз за сессию (ленивая инициализация).
 * Загружает файлы из `rootDir` и `cwd`, применяет префиксы `WB_` и `MIRTA_`.
 * Результат объединяется с `process.env`.
 *
 * @param rootDir - Корневая директория проекта.
 * @param cwd - Текущая рабочая директория (опционально).
 *
 * @since 0.4.0
 *
 **/
export function loadEnv(rootDir: string, cwd?: string) {

  if (isLoaded)
    return;

  const env = _loadEnv({

    cwd,
    rootDir,

    prefix: ['WB_', 'MIRTA_'],

  });

  // Объединяем с текущим process.env
  Object.assign(process.env, env);

  isLoaded = true;

}

/**
 * Заменяет в строке все вхождения `${VAR_NAME}` на значения из `process.env`.
 *
 * Используется для подстановки переменных в строках подключения, путях и т.д.
 *
 * @param input - Входная строка с переменными, например: `${WB_HOST}`
 * @returns Строка с подставленными значениями.
 * @throws Ошибка, если переменная не определена.
 *
 * @since 0.4.0
 *
 **/
export function replaceEnvVars(input: string): string {

  return input.replace(/\$\{([^}]+)\}/g, (_, key: string) => {

    const value = process.env[key];

    if (value === undefined)
      throw new Error(`Environment variable not set: ${key}`);

    return value;

  });

}

/**
 * Сбрасывает внутреннее состояние модуля (для тестов).
 *
 * Устанавливает флаг `isLoaded` в `false`, чтобы можно было повторно вызвать `loadEnv`.
 *
 * @remarks Не использовать в production-коде.
 *
 * @internal
 *
 * @since 0.4.0
 *
 **/
export function __resetInternalState() {

  if (!__TEST__)
    return;

  isLoaded = false;

}
