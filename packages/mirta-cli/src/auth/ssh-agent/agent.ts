import { DEFAULT_SSH_KEY_TTL, SSH_AUTH_SOCK, SSH_DIR } from './constants'
import type { AgentContext } from './types'
import { logger } from '#src/utils/logger'
import { STDIO_CAPTURE_ERRORS } from '#src/utils/shell'

/**
 * Обеспечивает запуск изолированного SSH-агента для текущей сессии CLI.
 *
 * Проверяет, запущен ли агент. Если нет — удаляет старый сокет (если есть), создаёт директорию `~/.ssh`,
 * и запускает новый экземпляр `ssh-agent` с ограниченным временем жизни ключей.
 *
 * Используется для безопасного управления ключами и токенами (PKCS#11) без влияния на основной агент системы.
 *
 * @param context - Контекст выполнения (включая поддержку WSL2).
 * @throws Ошибка, если не удалось запустить `ssh-agent`.
 *
 * @since 0.4.0
 *
 **/
export async function ensureAgentIsRunningAsync(context: AgentContext): Promise<void> {

  try {

    // Проверяем, отвечает ли агент

    const result = await context.runAsync(
      'ssh-add', ['-l'],
      {
        env: {
          SSH_AUTH_SOCK,
        },
        stdio: STDIO_CAPTURE_ERRORS,
        doneCodes: [0, 1],
      }
    )

    if (result.code === 0 || result.code === 1) {

      logger.debug('SSH agent is running')
      return

    }

  }
  catch {

    // Агент не отвечает — продолжаем инициализацию

  }

  try {

    // Удаляем старый сокет, если существует
    await context.runAsync('rm', ['-f', SSH_AUTH_SOCK], { stdio: STDIO_CAPTURE_ERRORS })

  }
  catch (e: unknown) {

    logger.warn(`Could not remove stale socket: ${e instanceof Error ? e.message : String(e)}`)

  }

  try {

    // Создаём директорию ~/.ssh, если не существует
    await context.runAsync('mkdir', ['-p', SSH_DIR], { stdio: STDIO_CAPTURE_ERRORS })

  }
  catch (e: unknown) {

    logger.warn(
      `Could not create SSH directory: ${e instanceof Error ? e.message : String(e)}`
    )

  }

  // Аргументы для запуска ssh-agent
  const args = ['-a', SSH_AUTH_SOCK, '-t', DEFAULT_SSH_KEY_TTL]

  // Если используется PKCS#11, указываем путь к модулю
  if (context.pkcs11)
    args.push('-P', context.pkcs11)

  try {

    await context.runAsync(
      'ssh-agent',
      args,
      {
        stdio: STDIO_CAPTURE_ERRORS,
      }
    )

    logger.debug('SSH agent started')

  }
  catch (e) {

    throw new Error(`Failed to start ssh-agent: ${e instanceof Error ? e.message : String(e)}`)

  }

}
