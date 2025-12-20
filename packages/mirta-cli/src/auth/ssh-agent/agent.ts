import { DEFAULT_SSH_KEY_TTL, SSH_AUTH_SOCK } from './constants'
import type { AgentContext } from './types'
import { useLogger } from '#src/utils/logger'

const logger = useLogger()

export async function ensureAgentIsRunningAsync(context: AgentContext): Promise<void> {

  try {

    // Проверяем, отвечает ли агент

    const result = await context.runAsync(
      'ssh-add', ['-l'],
      {
        env: {
          SSH_AUTH_SOCK,
        },
        stdio: 'pipe',
        doneCodes: [0, 1],
      }
    )

    if (result.code === 0 || result.code === 1) {

      logger.debug('SSH agent is running')
      return

    }

  }
  catch {

    // Агент не отвечает — продолжаем

  }

  try {

    await context.runAsync('rm', ['-f', SSH_AUTH_SOCK], { stdio: 'pipe' })

  }
  catch (e: unknown) {

    logger.warn(`Could not remove stale socket: ${e instanceof Error ? e.message : String(e)}`)

  }

  const args = ['-a', SSH_AUTH_SOCK, '-t', DEFAULT_SSH_KEY_TTL]

  if (context.pkcs11)
    args.push('-P', context.pkcs11)

  try {

    await context.runAsync(
      'ssh-agent',
      args,
      { stdio: 'pipe' }
    )

    logger.debug('SSH agent started')

  }
  catch (e) {

    throw new Error(`Failed to start ssh-agent: ${e instanceof Error ? e.message : String(e)}`)

  }

}
