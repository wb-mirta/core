import type { DeployMapping, MirtaConnection } from '#config/types'
import { logger } from '#utils/logger'
import { t } from '#i18n'
import { runCommandAsync, STDIO_INTERACTIVE } from '#utils/shell'
import { SSH_AUTH_SOCK } from '#auth/constants'
import { KNOWN_SSH_PORT } from '#config/constants'

/**
 * Параметры для выполнения команды rsync.
 *
 * @since 0.4.0
 *
 **/
export interface RunRsyncOptions {

  /**
   * Подключение к целевому серверу.
   *
   **/
  connection: MirtaConnection

  /**
   * Правило копирования: исходный и целевой пути, фильтры.
   *
   **/
  mapping: DeployMapping

  /**
   * Целевая группа на контроллере, для установки прав доступа.
   *
   **/
  toGroup?: string

  /**
   * Рабочая директория (обычно корень проекта).
   *
   **/
  cwd: string

  /**
   * Режим симуляции — команда не применяется, только показываются изменения.
   *
   **/
  isDryRun?: boolean

}

/**
 * Асинхронно выполняет синхронизацию файлов с контроллером через `rsync` по SSH.
 *
 * Если исходный путь не существует — операция пропускается без ошибки.
 * Поддерживает фильтрацию, очистку, защиту файлов и изменение группы.
 * На Windows команда выполняется внутри WSL2.
 *
 * @param options - Параметры синхронизации.
 *
 * @since 0.4.0
 *
 **/
export async function runRsyncAsync(options: RunRsyncOptions): Promise<void> {

  const {
    connection,
    mapping,
    toGroup,
    cwd,
    isDryRun,
  } = options

  const args: string[] = []

  const sshParts: string[] = []

  if (connection.port && connection.port !== KNOWN_SSH_PORT)
    sshParts.push(`-p ${connection.port}`)

  if (sshParts.length > 0)
    args.push('-e', `'ssh ${sshParts.join(' ')}'`)

  // Флаги rsync:
  // -r: рекурсивно
  // -t: сохранять время файлов
  // -z: сжатие
  // -g: сохранять группу
  // -O: не обновлять время на директориях

  args.push(
    '-rtzgO'
  )

  if (isDryRun)
    args.push('--dry-run', '--itemize-changes')

  if (mapping.cleanup)
    args.push('--delete')

  mapping.exclude?.forEach((pattern) => {

    args.push('--exclude', pattern)

  })

  mapping.protect?.forEach((pattern) => {

    args.push('--filter', `P ${pattern}`)

  })

  if (toGroup)
    args.push('--groupmap', `*:${toGroup}`)

  const to = `${connection.username}@${connection.hostname}:${mapping.to}`

  args.push(
    mapping.from,
    to
  )

  logger.step(t('deploy.transmitting', {
    from: mapping.from,
    to: mapping.to,
  }))

  await runCommandAsync.inUnixShell(connection.wsl)('rsync', [...args], {
    env: {
      SSH_AUTH_SOCK,
    },
    cwd,
    stdio: STDIO_INTERACTIVE,
    shell: false,
  })

}
