import { loadEnv, type EnvLoaderOptions } from './load-env'

/**
 * Загружает и фильтрует переменные окружения из dotenv-файлов.
 * Используется совместно с `@rollup/plugin-replace` для замены значений в коде.
 *
 * @param options Опции загрузки и фильтрации переменных окружения (см. {@link EnvLoaderOptions}).
 * @returns Объект с ключами вида `process.env.KEY` и `import.meta.env.KEY`, где `KEY` — имя переменной окружения.
 *
 *
 * @since 0.4.0
 *
 **/
export function loadEnvReplacements(options: EnvLoaderOptions = {}) {

  const env = loadEnv(options)

  const result: Record<string, string> = {}

  for (const [key, rawValue] of Object.entries(env)) {

    const value = JSON.stringify(rawValue)

    result[`process.env.${key}`] = value
    result[`import.meta.env.${key}`] = value

  }

  return result

}
