import type { MirtaConfig } from './types'
import { readConfigAsync } from './config'
import { DEFAULT_CONFIG_FILE } from './constants'
import { deepMerge } from '@mirta/basics/object'
import defaultConfig from './default'
import { SourceError } from '#src/errors/source-error'

/**
 * Результат разрешения конфигурации.
 *
 * @since 0.4.0
 *
 **/
export interface ResolvedConfig {

  /**
   * Итоговая конфигурация после слияния конфигурации по умолчанию и пользовательской.
   *
   **/
  config: MirtaConfig

  /**
   * Пользовательская конфигурация, прочитанная из файла.
   * Может быть `undefined`, если файл не найден или не указан.
   *
   **/
  userConfig?: MirtaConfig

}

/**
 * Асинхронно разрешает итоговую конфигурацию для проекта.
 *
 * 1. Читает пользовательский конфиг из указанного пути или из `mirta.config.json` по умолчанию.
 * 2. Если путь указан явно, но файл не найден — выбрасывает ошибку.
 * 3. Сливает пользовательскую конфигурацию с конфигурацией по умолчанию (глубокое слияние).
 *
 * @param rootDir - Корневая директория проекта.
 * @param path - Путь к пользовательскому конфигурационному файлу (опционально).
 * @returns Объект `ResolvedConfig` с итоговой и пользовательской конфигурацией.
 * @throws {SourceError} Если файл не найден при явном указании пути.
 *
 **/
export async function resolveConfigAsync(
  rootDir: string,
  path?: string
): Promise<ResolvedConfig> {

  const userConfig = await readConfigAsync(rootDir, path ?? DEFAULT_CONFIG_FILE)

  if (!userConfig && path)
    throw SourceError.get('file.notFound', path)

  return {
    config: deepMerge(defaultConfig, userConfig),
    userConfig,
  }

}
