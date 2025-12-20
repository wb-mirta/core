import type { KeyPath } from '#src/config/types'
import { useLogger } from '#src/utils/logger'
import { SSH_AUTH_SOCK } from './constants'
import { hasEntryAsync } from './entry'
import type { AgentContext } from './types'

const logger = useLogger()

export async function getFingerprintAsync(
  key: string,
  context: AgentContext
): Promise<string> {

  const response = await context.runAsync(
    'ssh-keygen',
    ['-lf', key],
    {
      stdio: 'pipe',
    })

  const output = response.stdout.trim()

  if (!output)
    throw new Error('No data from ssh-keygen')

  const fingerprint = output.split(' ')[1]

  if (!fingerprint)
    throw new Error('No fingerprint in ssh-keygen output')

  return fingerprint

}

export async function hasKeyAsync(path: KeyPath, context: AgentContext): Promise<boolean> {

  const fingerprint = await getFingerprintAsync(path, context)

  return await hasEntryAsync(fingerprint, context)

}

export async function addKeyAsync(path: KeyPath, context: AgentContext): Promise<void> {

  const args = ['-q']

  if (context.ttl)
    args.push('-t', context.ttl)

  args.push(path)

  await context.runAsync(
    'ssh-add',
    args,
    {
      env: {
        SSH_AUTH_SOCK,
      },
      stdio: 'inherit',
      cancelCodes: [2, 130],
    })

  logger.debug('SSH key added to ssh-agent')

}
