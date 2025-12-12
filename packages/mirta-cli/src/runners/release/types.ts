export interface ReleaseContext {
  currentVersion: string
  targetVersion: string
  preid: string | undefined
  isDryRun: boolean
  skipPrompts: boolean
  skipGit: boolean
  inWorkTree: boolean
  repository?: string
  connectionType?: 'ssh' | 'https'
}
