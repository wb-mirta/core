import { runCommandAsync } from '#src/utils/shell'
import type { MirtaConnection } from '#src/config/types'
import type { AgentContext } from './ssh-agent/types'
import { ensureAgentIsRunningAsync } from './ssh-agent/agent'
import { hasTokenAsync, addTokenAsync, removeTokenAsync } from './ssh-agent/token'
import { hasKeyAsync, addKeyAsync } from './ssh-agent/key'
import { useLogger } from '#src/utils/logger'

const logger = useLogger()

export async function authenticateAsync(
  connection: MirtaConnection
): Promise<void> {

  if (connection.type !== 'ssh')
    return

  const context: AgentContext = {

    pkcs11: connection.pkcs11,
    key: connection.key,
    ttl: connection.ttl,

    runAsync: runCommandAsync.inUnixShell(connection.wsl),

  }

  // Ленивая инициализация агента SSH - только если это имеет смысл.

  if (context.pkcs11 || context.key) {

    await ensureAgentIsRunningAsync(context)

    // Приоритет pkcs11 над key для кросс-машинной совместимости.
    // TODO: добавить fallback на key, если токен pkcs11 не обнаружен.
    //
    if (context.pkcs11) {

      const hasToken = await hasTokenAsync(context.pkcs11, context)

      if (!hasToken) {

        // Если срок действия токена истёк —
        // выгружаем модуль, иначе повторно не добавить.
        //
        const isRemoved = await removeTokenAsync(context.pkcs11, context)

        if (isRemoved)
          logger.debug('Stale PKCS#11 module unloaded')

        await addTokenAsync(context.pkcs11, context)

      }

    }
    else if (context.key) {

      const hasKey = await hasKeyAsync(context.key, context)

      if (!hasKey)
        await addKeyAsync(context.key, context)

    }

  }

}
