export interface CliScope {
  projectName: string
  projectRoot: string
  packageName?: string
  packageManager?: string
  shouldOverwrite?: boolean
  features: string[]
}
