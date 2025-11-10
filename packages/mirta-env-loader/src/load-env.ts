import nodePath from 'node:path'
import dotenvx from '@dotenvx/dotenvx'
import { ensureArray, ensureCompactArray } from '@mirta/basics/array'
import { existsSync } from 'node:fs'

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
   * Префиксы для фильтрации переменных окружения.
   *
   * Если не указано, используется значение по умолчанию из {@link DEFAULT_ENV_PREFIXES}.
   *
   * @example
   * // Фильтрация по одному префиксу
   * prefix: 'APP_'
   * // → включаются только переменные, начинающиеся с `APP_`
   *
   * @example
   * // Фильтрация по нескольким префиксам
   * prefix: ['MIRTA_', 'CUSTOM_']
   * // → включаются переменные с `MIRTA_` или `CUSTOM_`
   *
   **/
  prefix?: string | string[]

  /**
   * Текущая рабочая директория для обнаружения и загрузки файлов `.env`.
   *
   **/
  cwd?: string

  /**
   * Корневая директория проекта.
   *
   * Используется для обнаружения и загрузки общих `.env`-файлов.
   * Если не указана или совпадает с `cwd`, поиск в корне не выполняется.
   *
   **/
  rootDir?: string

  /**
   * Префикс файла с переменными окружения, по умолчанию `'.env'`.
   *
   **/
  envFile?: string | string[]

  /**
   * Определяет, нужно ли включать переменную `NODE_ENV` в результат.
   *
   * @default true
   *
   * @remarks
   *
   * Используется для изоляции тестовой среды или предотвращения
   * утечки режима выполнения в клиентский код.
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

  rootDir?: string

  envFile?: string | string[]

  quiet?: boolean

}

/**
 * Возвращает возможные имена .env-файлов в зависимости от режима окружения.
 *
 * @param mode - Название текущего режима (например, `'development'`, `'production'`, `'test'`).
 *               Если значение не определено, возвращается только базовый файл.
 * @param envFile - Базовое имя файла, которое будет дополнено (по умолчанию `.env`).
 * @returns Массив строк с путями к файлам окружения, отсортированный в порядке убывания приоритета загрузки.
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

  if (mode === 'test' && envFile.endsWith('.local'))
    return []

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
 * Формирует список существующих файлов окружения для загрузки на основе режима, текущей и корневой директорий.
 *
 * @param options - Опции разрешения путей: `mode` (env mode), `cwd` (текущая рабочая директория), `rootDir` (опциональная корневая директория для общих .env), `envFile` (имя или список базовых файлов, по умолчанию `.env`), `quiet` (подавлять предупреждения о дубликатах)
 * @returns Массив абсолютных путей к существующим файлам окружения, в порядке поиска (сначала по `cwd`, затем по `rootDir` при наличии)
 *
 * @since 0.4.0
 */
export function resolveEnvFiles(options: EnvResolutionOptions) {

  const { mode, cwd, rootDir, envFile = '.env', quiet } = options

  // Сначала — все файлы из cwd
  const lookupDirs = [cwd]

  // Потом — все файлы из rootDir, если директория указана
  if (rootDir && rootDir !== cwd)
    lookupDirs.push(rootDir)

  // Преобразует envFile в массив уникальных значений:
  // удаляет дубликаты с помощью `Set`.
  //
  let envFiles = [
    ...new Set(ensureArray(envFile)),
  ]

  if (envFiles.length > 1)
    envFiles = envFiles.sort((a, b) => a.length - b.length)

  const envFilesVariants = new Set<string>()

  for (const file of envFiles) {

    for (const variant of getEnvFileVariantsByMode(mode, file)) {

      if (envFilesVariants.has(variant) && !quiet) {

        console.warn(`[@mirta/env-loader] Redundant env file entry detected: "${file}" may be unnecessary, as it generates a file already covered by another entry.`)
        continue

      }

      envFilesVariants.add(variant)

    }

  }

  const result: string[] = []

  // Перечисляем директории, в которых нужно выполнить поиск.
  for (const dir of lookupDirs) {

    // Перемножаем на варианты .env-файлов (обычно это все вариации `.env`)
    for (const file of envFilesVariants) {

      const path = nodePath.join(dir, file).replaceAll('\\', '/')

      // Самостоятельно отсеиваем несуществующие файлы,
      // чтобы предотвратить падение производительности.
      //
      if (existsSync(path))
        result.push(path)

    }

  }

  return result

}

/**
 * Отбирает из заданного набора только допустимые переменные окружения и возвращает их в детерминированном порядке.
 *
 * Фильтрация пропускает только пары, у которых есть определённое строковое значение; ключы, совпадающие с любым из указанных префиксов, и (опционально) `NODE_ENV` включаются в результат.
 *
 * @param env - Объект переменных окружения, значения могут быть `undefined`; только пары с определёнными строковыми значениями рассматриваются.
 * @param prefixes - Список префиксов; ключ включается, если начинается с любого из этих префиксов.
 * @param keepNodeEnv - Если `true`, ключ `NODE_ENV` будет включён в результат независимо от префиксов.
 * @returns Объект с отфильтрованными парами ключ/значение; ключи отсортированы лексикографически с учётом числовых частей.
 *
 * @since 0.4.0
 */
export function filterEnvKeys(

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
 * @param options Опции загрузки и фильтрации переменных окружения (см. {@link EnvLoaderOptions}).
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
    rootDir,
    envFile = '.env',

    keepNodeEnv = true,
    dotenv,

  } = options

  // Хранилище для загруженных переменных окружения.
  let processEnv = { ...process.env } as Record<string, string>

  const files = resolveEnvFiles({ cwd, rootDir, mode, envFile, quiet: dotenv?.quiet })

  if (files.length > 0)
    dotenvx.config({
      // Переопределяемые параметры конфигурации:
      logLevel: 'warn',
      ignore: [
        'MISSING_ENV_FILE',
      ],

      // Пользовательская конфигурация.
      ...dotenv,

      // Параметры, которые переопределить нельзя:
      path: files,
      processEnv,
      convention: undefined,
    })

  // Фильтрация переменных по заданным префиксам.
  processEnv = filterEnvKeys(processEnv, ensureCompactArray(prefix), keepNodeEnv)

  return processEnv

}
