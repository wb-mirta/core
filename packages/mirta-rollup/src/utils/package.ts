import { readFileSync } from 'fs'

/**
 * Читает конфигурацию `package.json` и возвращает её
 * в виде экземпляра {@link Package}.
 *
 * @since 0.3.5
 *
 **/
export function parsePackageJson(filePath: string) {

  const pkg = JSON.parse(
    readFileSync(filePath, 'utf-8')
  ) as Package

  return pkg

}
