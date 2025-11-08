import nodePath from 'node:path'
import dotenvx from '@dotenvx/dotenvx'
import { compactArray } from '@mirta/basics/array'

/**
 * Регулярное выражение, определяющее допустимые префиксы для переменных окружения,
 * которые будут загружены в проект.
 *
 * @description
 * Константа используется для фильтрации переменных окружения по их префиксам:
 * - `MIRTA_` — системные настройки фреймворка (например, логирование, таймауты).
 * - `APP_` — пользовательские сценарии и параметры автоматизаций (например, расписания, пороговые значения).
 *
 * @example
 * ```env
 * # Пример переменной окружения, которая будет учтена
 * MIRTA_LOG_LEVEL=debug
 * APP_LIVING_ROOM_LIGHTS_SCHEDULE='18:00-22:00'
 *
 * ```
 * @remarks
 * Эта константа предназначена для использования в конфигурации `loadEnv`, где указывается фильтр для загрузки `.env`-файлов.
 * Может быть переопределена через пользовательскую конфигурацию, если требуется изменить список допустимых префиксов.
 *
 * @since 0.4.0
 *
 **/
export const DEFAULT_ENV_PREFIXES = ['MIRTA_', 'APP_'] as const

/**
 * Интерфейс для настройки параметров `dotenvx`.
 *
 * @since 0.4.0
 *
 **/
export interface DotenvOptions {

  /**
   * Кодировка файла `.env`, по умолчанию `'utf-8'`
   *
   **/
  encoding?: string

  /**
   * Перезаписывает любые существующие переменные окружения значениями из файла `.env`
   *
   * @default false
   *
   **/
  overload?: boolean

  /**
   * Выбрасывает ошибку сразу при её возникновении — например, при отсутствии файла `.env`.
   *
   * @default false
   *
   **/
  strict?: boolean

  /**
   * Подавляет конкретные ошибки, например `MISSING_ENV_FILE`.
   *
   * Ключи ошибок можно найти в [исходном коде](https://github.com/dotenvx/dotenvx/blob/main/src/lib/helpers/errors.js) библиотеки `dotenvx`.
   *
   **/
  ignore?: string[]

  /**
   * Путь к файлу с приватными ключами `.env.keys`, полезно для монорепозиториев.
   *
   **/
  envKeysFile?: string

  /**
   * Соглашение `.env`, определяет очерёдность загрузки файлов.
   *
   **/
  convention?: 'nextjs' | 'flow'

  /**
   * Включает логирование для диагностики причин, почему определённые ключи или значения не устанавливаются.
   *
   * @default false
   *
   **/
  debug?: boolean

  /**
   * Увеличивает уровень детализации логов.
   *
   * @default false
   *
   **/
  verbose?: boolean

  /**
   * Подавляет все сообщения в консоль, даже ошибки.
   *
   * @default false
   *
   **/
  quiet?: boolean

  /**
   * Уровень логирования. Определяет, какие сообщения будут выводиться в консоль.
   *
   **/
  logLevel?:
    | 'error'
    | 'warn'
    | 'success'
    | 'successv'
    | 'info'
    | 'help'
    | 'verbose'
    | 'debug'

}

/**
 * Позволяет настроить поведение загрузки и фильтрации переменных окружения.
 *
 * @since 0.4.0
 *
 **/
export interface EnvLoaderOptions {

  /**
   * Режим окружения (например, `'development'`, `'production'`, `'test'`).
   *
   * По умолчанию используется значение из `process.env.NODE_ENV`.
   *
   **/
  mode?: string

  /**
   * Префикс для фильтрации переменных окружения.
   *
   * @example
   *
   * ```txt
   * 'APP_' — выбираются только переменные, начинающиеся с этого префикса.
   *
   * ```
   **/
  prefix?: string | string[]

  /**
   * Текущая рабочая директория для поиска файлов `.env`.
   *
   **/
  cwd?: string

  /**
   * Корневая директория монорепозитория (если проект использует такую структуру).
   *
   **/
  monorepoDir?: string

  /**
   * Префикс файла с переменными окружения, по умолчанию `'.env'`.
   *
   **/
  envFile?: string | string[]

  /**
   * Определяет, нужно ли включать переменную `NODE_ENV` в результат.
   *
   * По умолчанию - `true`.
   *
   **/
  keepNodeEnv?: boolean

  /**
   * Дополнительные параметры библиотеки `dotenvx`.
   *
   **/
  dotenv?: DotenvOptions

}

/**
 * Параметры для разрешения (определения) файлов окружения.
 *
 * @since 0.4.0
 *
 **/
interface EnvResolutionOptions {

  mode: string | undefined

  cwd: string

  monorepoDir?: string

  envFile?: string | string[]

}

/**
 * Возвращает возможные имена .env-файлов в зависимости от режима окружения.
 *
 * @param mode - Название текущего режима (например, `'development'`, `'production'`, `'test'`).
 *               Если значение не определено, возвращается только базовый файл.
 * @param envFile - Базовое имя файла, которое будет дополнено (по умолчанию `.env`).
 * @returns Массив строк с путями к файлам окружения, отсортированный по приоритету загрузки.
 *
 * @since 0.4.0
 *
 **/
function getEnvFileVariantsByMode(

  mode: string | undefined,
  envFile: string

) {

  if (!mode)
    return [envFile]

  const envFiles: string[] = []

  // 1. Формируем файлы с суффиксом .local для конкретного окружения (кроме test)
  if (mode !== 'test')
    envFiles.push(`${envFile}.${mode}.local`)

  // 2. Формируем файл для конкретного окружения без .local
  envFiles.push(`${envFile}.${mode}`)

  // 3. Формируем глобальный .local-файл (кроме test)
  if (mode !== 'test')
    envFiles.push(`${envFile}.local`)

  // 4. Базовый файл
  envFiles.push(envFile)

  // Собираем список и убираем пустые элементы
  return envFiles

}

/**
 * Разрешает пути к файлам окружения в зависимости от режима работы, текущей директории и структуры монорепозитория
 *
 * @param options - Параметры разрешения путей.
 * @returns Массив абсолютных путей к файлам окружения.
 *
 * @since 0.4.0
 *
 **/
function resolveEnvFiles(options: EnvResolutionOptions) {

  const { mode, cwd, envFile = '.env' } = options

  // Определяет директорию монорепозитория, если она указана и отличается от `cwd`.
  // Используется для поиска `.env`-файлов в родительской структуре проекта.
  //
  const monorepoDir = (options.monorepoDir !== cwd) && options.monorepoDir

  // Преобразует envFile в массив уникальных значений:
  // удаляет дубликаты с помощью `Set`.
  //
  const envFiles = [
    ...new Set(Array.isArray(envFile) ? envFile : [envFile]),
  ]

  const resultFiles: string[] = []

  // Для каждого файла из `envFiles`
  // 1. Получает варианты названий файлов на основе `mode` через `getEnvFileVariantsByMode`.
  // 2. Строит полные пути к файлам:
  //    - В текущей директории (`cwd`);
  //    - В монорепозитории (`monorepoDir`), если он указан.
  //
  for (const file of envFiles) {

    const fileVariants = getEnvFileVariantsByMode(mode, file)

    for (const variant of fileVariants) {

      resultFiles.push(nodePath.join(cwd, variant))

      if (monorepoDir)
        resultFiles.push(nodePath.join(monorepoDir, variant))

    }

  }

  return resultFiles

}

/**
 * Фильтрует и сортирует переменные окружения по заданным префиксам и правилам.
 *
 * @param env Объект переменных окружения в формате `{ ключ: значение | undefined }`.
 * @param prefixes Массив строковых префиксов (например, `['MIRTA_', 'APP_']`).
 *                 Ключ будет включен, если начинается с любого из этих префиксов.
 * @param keepNodeEnv Определяет, включать ли переменную `NODE_ENV` в результат,
 *                    независимо от наличия префикса.
 * @returns Объект с отфильтрованными и отсортированными ключами в лексикографическом порядке.
 *
 * @since 0.4.0
 *
 **/
function filterEnvKeys(

  env: Record<string, string | undefined>,
  prefixes: string[],
  keepNodeEnv: boolean

) {

  // Типовой гвард для проверки ключа и значения.
  const isValidEntry = (entry: [string, string | undefined]): entry is [string, string] => {

    const [key, value] = entry

    if (value === undefined)
      return false

    if (key === 'NODE_ENV')
      return keepNodeEnv

    return prefixes.some(prefix => key.startsWith(prefix))

  }

  // Фильтрация и сортировка пар "ключ-значение", гарантирует
  // детерминированный порядок ключей.
  //
  const filteredEntries = Object.entries(env)
    .filter(isValidEntry)
    .sort(([keyA], [keyB]) => keyA.localeCompare(keyB, 'en-US', {
      sensitivity: 'base', // Игнорирует регистр и диакритики
      numeric: true, // Числа в строках сравниваются как числа
    }))

  // Преобразует массив `[ключ, значение]` обратно в объект.
  // Гарантирует детерминированный порядок ключей.
  //
  return Object.fromEntries(filteredEntries)

}

/**
 * Загружает и фильтрует переменные окружения из dotenv-файлов.
 * @param options Опции загрузки и фильтрации переменных окружения (см. {@link EnvOptions}).
 * @returns Набор переменных окружения.
 *
 * @since 0.4.0
 *
 **/
export function loadEnv(options: EnvLoaderOptions = {}) {

  const {

    mode = process.env.NODE_ENV,
    prefix = [...DEFAULT_ENV_PREFIXES],

    cwd = process.cwd(),
    monorepoDir,
    envFile = '.env',

    keepNodeEnv = true,
    dotenv,

  } = options

  // Хранилище для загруженных переменных окружения.
  let processEnv: Record<string, string> = {}

  dotenvx.config({

    // Переопределяемые параметры конфигурации:

    logLevel: 'warn',
    ignore: [
      'MISSING_ENV_FILE',
    ],

    // Внешнаяя конфигурация.
    ...dotenv,

    // Параметры, которые переопределить нельзя:

    path: resolveEnvFiles({ cwd, monorepoDir, mode, envFile }),
    processEnv,
  })

  // Фильтрация переменных, если задан префикс.
  if (prefix)
    processEnv = filterEnvKeys(processEnv, compactArray(prefix), keepNodeEnv)

  return processEnv

}

/**
 * Загружает и фильтрует переменные окружения из dotenv-файлов.
 * Используется совместно с `@rollup/plugin-replace` для замены значений в коде.
 *
 * @param options Опции загрузки и фильтрации переменных окружения (см. {@link EnvOptions}).
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
