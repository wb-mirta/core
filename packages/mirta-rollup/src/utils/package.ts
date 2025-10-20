import { readFileSync } from 'fs'
import { FileError } from './errors'

/**
 * Синхронно парсит файл `package.json` и возвращает его содержимое в виде
 * типизированного объекта. Обрабатывает распространённые ошибки
 * файловой системы и синтаксические ошибки JSON с помощью пользовательских исключений.
 *
 * @param filePath - Абсолютный или относительный путь к файлу `package.json`.
 * @returns Объект типа {@link Package}, представляющий данные из файла.
 * @throws {FileError} При ошибке обработки файла.
 *
 * @since 0.3.5
 *
 **/
export function parsePackageJson(filePath: string) {

  try {

    const content = readFileSync(filePath, 'utf-8')
    return JSON.parse(content) as Package

  }
  catch (e: unknown) {

    if (e instanceof SyntaxError)
      throw FileError.get('invalidJson', filePath, e.message)

    if (e instanceof Error) {

      if ('code' in e) {

        switch (e.code) {

          case 'ENOENT':
            throw FileError.get('notFound', filePath)

          case 'EACCES':
          case 'EPERM':
            throw FileError.get('noAccess', filePath)

        }

      }

      throw FileError.get('failedToParse', filePath, e.message)

    }

    throw FileError.get('failedToParse', filePath, String(e))

  }

}
