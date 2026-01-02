import sortDependencies from '#utils/sort-dependencies'
import fs, { glob } from 'node:fs/promises'
import { relative, basename, join } from 'node:path'
import { parseJson } from './parse-json'
import { renderJsonAsync } from './render-json'
import { isExistsAsync } from '#utils/file-system'
import type { FilePath } from '#types'
import { isPlainObject } from '@mirta/basics'

/** Папки и файлы, игнорируемые при обходе шаблона. */
const IGNORED_DIRS = [
  'node_modules/**',
  '.git/**',
  'dist/**',
  '*.log',
]

/** JSON-файлы, которые мержатся с существующими при копировании. */
const KNOWN_JSON = [
  'extensions.json',
  'settings.json',
  'tasks.json',
  'tsconfig.json',
]

/**
 * Элемент файловой системы из шаблона.
 *
 * @since 0.4.0
 *
 **/
interface Dirent {

  /** Относительный путь от корня шаблона. */
  readonly relativePath: string
  /** Имя файла/директории. */
  readonly name: string
  /** Является ли директорией. */
  readonly isDirectory: boolean

}

type BasicValue = string | number | boolean

type TemplateData = Record<string, BasicValue>

/**
 * Асинхронно перебирает файлы директории, исключая {@link IGNORED_DIRS}.
 *
 * @param rootDir Корневая директория шаблона.
 * @yields Объекты {@link Dirent} для каждого элемента.
 *
 * @since 0.4.0
 *
 **/
export async function* getDirectoryEntriesAsync(rootDir: string): AsyncGenerator<Dirent> {

  for await (const entry of glob('**/*', {
    cwd: rootDir,
    exclude: IGNORED_DIRS,
    withFileTypes: true,
  })) {

    const relativePath = relative(rootDir, entry.parentPath)

    yield {
      relativePath,
      name: entry.name,
      isDirectory: entry.isDirectory(),
    }

  }

}

const supportedTypes = ['string', 'number', 'boolean']

export function toTemplateData(
  source: object
): TemplateData {

  const result: Record<string, string | number | boolean> = {}

  // Инициализация: корневые свойства
  const stack = Object.entries(source) as [string, unknown][]

  let nextItem: [string, unknown] | undefined

  while (stack.length > 0 && (nextItem = stack.pop())) {

    const [path, value] = nextItem // DFS

    const valueType = typeof value

    if (supportedTypes.includes(valueType)) {

      result[path] = value as BasicValue
      continue

    }

    if (Array.isArray(value)) {

      for (const item of value) {

        if (typeof item === 'string')
          result[`${path}.${item}`] = true

      }

      continue

    }

    if (!isPlainObject(value))
      continue

    const entries = Object.entries(value)

    for (let i = entries.length - 1; i >= 0; i--) {

      const [key, nextValue] = entries[i]

      stack.push([`${path}.${key}`, nextValue])

    }

  }

  return result

}

/**
 * Заменяет в строке `{{key}}` и `{{#if key}}...{{/if key}}` на значения параметра `data`.
 *
 * @param content Текст с шаблонами.
 * @param data Данные для подстановки.
 * @returns Обработанный текст.
 *
 * @since 0.4.0
 *
 **/
export function applyTemplatedText(
  content: string,
  data: TemplateData
): string {

  // Сначала обрабатываем условные блоки: {{#if key}}...{{/if key}}
  content = content.replace(
    /{{#if\s+([a-zA-Z0-9_.]+)}}\n?([\s\S]*?)\n?{{\/if\s+\1}}/g,
    (_, key: string, blockContent: string) => {

      return key in data ? applyTemplatedText(blockContent, data) : ''

    }
  )

  // Затем подставляем переменные: {{key}}
  content = content.replace(
    /{{([a-zA-Z0-9_.]+)}}/g,
    (_, key: string) => {

      return key in data ? String(data[key]) : ''

    }
  )

  return content

}

/**
 * Копирует или обрабатывает файл в целевую директорию.
 * Учитывает специальные случаи: `package.json`, `.gitignore`, скрытые файлы.
 *
 * @param fromPath Путь к исходному файлу.
 * @param toPath Путь к целевому файлу.
 * @param content Опциональное содержимое (если файл шаблонизирован).
 *
 * @since 0.4.0
 *
 **/
export async function renderFileAsync(
  fromPath: FilePath,
  toPath: FilePath,
  content?: string
): Promise<void> {

  const toFileName = basename(toPath)

  // Мерж package.json с сортировкой зависимостей
  if (toFileName === 'package.json' && await isExistsAsync(toPath)) {

    await renderJsonAsync(
      content ? parseJson(content) : fromPath,
      toPath,
      json => sortDependencies(json)
    )

    return

  }

  // Мерж других известных JSON
  if (KNOWN_JSON.includes(toFileName) && await isExistsAsync(toPath)) {

    await renderJsonAsync(
      content ? parseJson(content) : fromPath,
      toPath
    )

    return

  }

  // Дописывание в .gitignore
  if (toFileName === '.gitignore' && await isExistsAsync(toPath)) {

    const oldContent = await fs.readFile(toPath, 'utf-8')
    const newContent = content ?? await fs.readFile(fromPath, 'utf-8')

    const separator = oldContent.endsWith('\n') ? '' : '\n'

    await fs.writeFile(toPath, oldContent + separator + newContent)
    return

  }

  // Запись обработанного контента
  if (content) {

    await fs.writeFile(toPath, content)
    return

  }

  // Для остальных файлов — простое копирование
  await fs.copyFile(fromPath, toPath)

}

/**
 * Обрабатывает `.tt`-файл: шаблонизирует и передаёт в {@link renderFileAsync}.
 *
 * @param fromPath Путь к `.tt`-файлу.
 * @param toPath Путь к целевому файлу (без `.tt`).
 * @param data Данные для шаблона.
 *
 * @since 0.4.0
 *
 **/
export async function renderFileTemplatedAsync(
  fromPath: FilePath,
  toPath: FilePath,
  data: TemplateData
): Promise<void> {

  const content = await fs.readFile(fromPath, 'utf-8')

  await renderFileAsync(
    fromPath,
    toPath,
    applyTemplatedText(content, data)
  )

}

/**
 * Применяет шаблон из `fromRoot` в `toRoot` с подстановкой данных.
 * Поддерживает `.tt`, `_ → .`, мерж JSON.
 *
 * @param fromRoot Корень шаблона.
 * @param toRoot Целевая директория.
 * @param data Данные для шаблонов.
 *
 * @since 0.4.0
 *
 **/
export async function renderDirectoryAsync(
  fromRoot: string,
  toRoot: string,
  data: TemplateData
): Promise<void> {

  for await (const entry of getDirectoryEntriesAsync(fromRoot)) {

    // === 1. Переданные директории воссоздаём в целевом расположении ===

    if (entry.isDirectory) {

      await fs.mkdir(
        join(toRoot, entry.relativePath, entry.name),
        { recursive: true }
      )

      continue

    }

    // === 2. Обрабатываем файлы ===

    // Формируем путь к исходному файлу.
    const fromPath = join(fromRoot, entry.relativePath, entry.name) as FilePath

    // Убираем экранирование точки в имени файла.
    const toFileName = entry.name.startsWith('_.')
      ? entry.name.slice(1)
      : entry.name

    // Формируем путь к целевому файлу.
    const toPath = join(toRoot, entry.relativePath, toFileName) as FilePath

    // Если файл шаблонизирован, обрабатываем его особым образом.
    if (toPath.endsWith('.tt')) {

      await renderFileTemplatedAsync(
        fromPath,
        toPath.slice(0, -3) as FilePath,
        data
      )

      continue

    }

    await renderFileAsync(fromPath, toPath)

  }

}
