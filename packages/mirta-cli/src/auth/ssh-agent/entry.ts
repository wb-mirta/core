import { MIRTA_AGENT_BINDING } from './constants'
import type { AgentContext } from './types'

export async function hasEntryAsync(
  fingerprint: string,
  context: AgentContext
): Promise<boolean> {

  const response = await context.runAsync(
    MIRTA_AGENT_BINDING,
    ['ssh-add', '-l'],
    {
      stdio: 'pipe',
      doneCodes: [0, 1], // 0 = есть ключи, 1 = нет ключей
    }
  )

  if (response.code === 1)
    return false

  return response.stdout.includes(fingerprint)

}
