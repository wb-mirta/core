import { readFileSync } from 'fs'
import { FileError } from './errors'

/**
 * Читает конфигурацию `package.json` и возвращает её
 * в виде экземпляра {@link Package}.
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
