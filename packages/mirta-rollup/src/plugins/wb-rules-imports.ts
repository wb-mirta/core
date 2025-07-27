import type { Plugin } from 'rollup'
import path from 'path'
import MagicString from 'magic-string'

// Абсолютный путь к результирующему каталогу.
const outputDir = path.join(process.cwd(), 'dist')
const modulesDir = path.join(outputDir, 'wb-rules-modules')

// Расположение обрабатываемого чанка.
const getChunkDir = (fileName: string) => path.dirname(path.join(outputDir, fileName))

// Шаблон для отлова конструкций require.
const patternRequire = /require\(['"]([^'"]+)'\)/g

/**
 * Плагин Rollup, перестраивающий пути импорта модулей
 * относительно каталога wb-rules-modules.
 * */
export default function wbRulesImports(): Plugin {

  return {
    name: 'wbRulesImports',
    // Выполняется перед записью содержимого
    // в результирующий файл.
    renderChunk(code, chunk) {

      // Виртуальный каталог не обрабатываем.
      if (chunk.fileName.startsWith('_virtual'))
        return

      const magicString = new MagicString(code)

      let hasReplacements = false
      let start: number
      let end: number

      const chunkDir = getChunkDir(chunk.fileName)

      // Преобразует путь подключения модуля в формат,
      // поддерживаемый контроллером Wirenboard.
      function rebaseRequire(match: RegExpExecArray) {

        // Начальная позиция оригинального вхождения
        start = match.index
        // Конечная позиция оригинального вхождения
        end = start + match[0].length

        // Преобразует путь подключаемого модуля в абсолютный,
        // опираясь на каталог с текущим обрабатываемым файлом.
        const requireAbsolutePath = path.resolve(chunkDir, match[1])

        // Если абсолютный путь начинается с каталога модулей...
        if (requireAbsolutePath.startsWith(modulesDir)) {

          const parsed = path.parse(
            path.relative(modulesDir, requireAbsolutePath)
          )

          const rebased = path
            .join(parsed.dir, parsed.name)
            .replaceAll(path.sep, path.posix.sep)

          // Удаляет расширение файла для полного соответствия
          // принципам импорта модулей wb-rules.
          const replacement = match[0]
            .replace(match[1], rebased)

          magicString.overwrite(start, end, replacement)

          // Признак произведённой замены.
          return true

        }

      }

      // Строит полный список конструкций require
      // в обрабатываемом файле.
      const matches = [...code.matchAll(patternRequire)]

      for (const match of matches) {

        if (rebaseRequire(match))
          hasReplacements = true

      }

      // Если никаких замен не было, то файл пропускается.
      if (!hasReplacements)
        return null

      return {
        code: magicString.toString(),
      }

    },
  }

}
