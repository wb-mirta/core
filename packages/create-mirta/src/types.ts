export interface CliScope {
  projectName: string
  projectRoot: string
  packageName?: string
  packageManager?: string
  shouldOverwrite?: boolean
  features: string[]
  sshUsername?: string
  sshHostname?: string
  sshPort?: string
  rutoken?: boolean
}

export type JsonObject = Branded<object, 'JsonObject'>

export type FilePath = Branded<string, 'FilePath'>
