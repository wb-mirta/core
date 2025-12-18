export type Pkcs11Path = Branded<string, 'Pkcs11Path'>

export type KeyPath = Branded<string, 'KeyPath'>

export type TimeToLive = Branded<string, 'TimeToLive'>

export type WslDistro = Branded<string, 'WslDistro'>

export interface MirtaConnection {

  type: string

  hostname: string

  port?: number

  username?: string

  pkcs11?: Pkcs11Path

  key?: KeyPath

  ttl?: TimeToLive

  wsl?: WslDistro

}

export type DeployFrom = Branded<string, 'DeployFrom'>
export type DeployTo = Branded<string, 'DeployTo'>

export interface DeployMapping {
  enabled?: boolean
  from: DeployFrom
  to: DeployTo
  cleanup?: boolean
  protect?: string[]
  exclude?: string[]
}

export interface DeployProfile {
  connection?: string
  mappings?: string[]
}

export interface DeployConfig {

  mappings?: Record<string, DeployMapping[]>
  profiles?: Record<string, DeployProfile>

}

export interface ProjectConfig {
  templates?: string[]
}

export interface MirtaConfig {
  connections?: Record<string, string | MirtaConnection>
  deploy?: DeployConfig
  project?: ProjectConfig
}
