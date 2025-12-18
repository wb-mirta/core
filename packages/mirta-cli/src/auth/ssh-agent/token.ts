import type { Pkcs11Path } from '#src/config/types'
import { useLogger } from '#src/utils/logger'
import { MIRTA_AGENT_BINDING } from './constants'
import { hasEntryAsync } from './entry'
import type { AgentContext } from './types'

const logger = useLogger()

export async function hasTokenAsync(
  path: Pkcs11Path,
  context: AgentContext
): Promise<boolean> {

  return await hasEntryAsync(path, context)

}

export async function addTokenAsync(
  path: Pkcs11Path,
  context: AgentContext
): Promise<void> {

  const args = ['ssh-add', '-q']

  if (context.ttl)
    args.push('-t', context.ttl)

  args.push('-s', path)

  await context.runAsync(
    MIRTA_AGENT_BINDING,
    args,
    {
      stdio: 'inherit',
      cancelCodes: [2, 130],
    })

  logger.debug('PKCS#11 token added to ssh-agent')

}
