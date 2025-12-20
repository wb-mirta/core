import type { MirtaConnection, WslDistroName } from '#src/config/types'
import { t } from '../i18n'
import { runCommandAsync } from './shell'

interface WslDistro {

  name: WslDistroName
  version: number
  isDefault: boolean

}

export async function assertWsl2ConfiguredAsync(connection: MirtaConnection) {

  try {

    const { stdout } = await runCommandAsync(
      'powershell',
      ['$env:WSL_UTF8=1;', 'wsl', '--list', '--verbose'],
      {
        stdio: 'pipe',
      })

    const lines = stdout.split('\n').slice(1) // Пропускаем заголовок

    const distros = new Map<string, WslDistro>()

    let defaultDistro: WslDistro | undefined

    for (const line of lines) {

      const match = /^(\*)?\s+(\S+)\s+(?:\S+)\s+(\d+)$/
        .exec(line.trim())

      if (!match)
        continue

      const distro = {
        name: match[2] as WslDistroName,
        version: parseInt(match[3], 10),
        isDefault: match[1] === '*',
      }

      if (distro.isDefault)
        defaultDistro = distro

      distros.set(distro.name.toLowerCase(), distro)

    }

    if (distros.size === 0)
      throw new Error(t('wsl.noDistros'))

    if (connection.wsl) {

      const targetDistro = distros.get(connection.wsl.toLowerCase())

      if (!targetDistro)
        throw new Error(t('wsl.distroNotFound', { name: connection.wsl }))

      if (targetDistro.version < 2)
        throw new Error(t('wsl.distroNotWsl2', { name: connection.wsl }))

      return

    }

    if (!defaultDistro)
      throw new Error(t('wsl.noDefault'))

    if (defaultDistro.version >= 2)
      return

    throw new Error(t('wsl.distroNotWsl2', { name: defaultDistro.name }))

  }
  catch (e: unknown) {

    // Пробрасываем внутренние ошибки валидации как есть
    if (e instanceof Error && !('code' in e))
      throw e

    if (e instanceof Error && 'code' in e && e.code === 'ENOENT')
      throw new Error(t('wsl.notInstalled'))

    throw new Error(t('wsl.error', {
      error: e instanceof Error ? e.message : String(e),
    }))

  }

}
