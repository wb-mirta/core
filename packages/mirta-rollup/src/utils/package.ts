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
  catch (e) {

    if (e instanceof Error) {

      if (e.name === 'SyntaxError') {

        throw FileError.get('invalidJson', filePath)

      }
      else if ('code' in e) {

        switch (e.code) {

          case 'ENOENT':
            throw FileError.get('notFound', filePath)

          case 'EACCES':
            throw FileError.get('noAccess', filePath)

        }

      }

      throw FileError.get('failedToParse', filePath, e.message)

    }

  }

}
