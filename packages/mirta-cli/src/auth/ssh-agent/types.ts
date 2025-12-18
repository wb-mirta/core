import type { Pkcs11Path, KeyPath, TimeToLive } from '#src/config/types'
import type { RunAsync } from '#src/utils/shell'

export interface AgentContext {

  pkcs11?: Pkcs11Path
  key?: KeyPath
  ttl?: TimeToLive

  runAsync: RunAsync

}
