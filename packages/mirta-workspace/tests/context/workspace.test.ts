import { findUp } from 'find-up'
import { WorkspaceError } from '#errors'
import { toPosix } from '@mirta/package'

vi.mock('find-up', () => ({
  findUp: vi.fn(),
}))

vi.mock('@mirta/package', async () => {

  const actual = await vi.importActual<typeof import('@mirta/package')>('@mirta/package')

  return ({
    ...actual,
    readPackageAsync: vi.fn(),
  })

})

const mockFindUp = vi.mocked(findUp)
const { readPackageAsync } = await import('@mirta/package')
const mockReadPackageAsync = vi.mocked(readPackageAsync)

const {
  resolveWorkspaceContextAsync,
} = await import('#context/workspace')

describe('workspace utilities', () => {

  beforeEach(() => {

    vi.clearAllMocks()

  })

  describe('resolveWorkspaceContextAsync', () => {

    it('should detect pnpm workspace', async () => {

      const workspaceRoot = '/home/user/monorepo'
      mockFindUp.mockResolvedValue(`${workspaceRoot}/pnpm-lock.yaml`)
      mockReadPackageAsync.mockResolvedValue({
        name: 'root',
        workspaces: ['packages/*'],
      })

      const result = await resolveWorkspaceContextAsync(`${workspaceRoot}/packages/app`)

      expect(result).toEqual({
        rootDir: workspaceRoot,
        manager: 'pnpm',
        workspaces: ['packages/*'],
      })
      expect(mockReadPackageAsync).toHaveBeenCalledWith(`${workspaceRoot}/package.json`)

    })

    it('should detect yarn workspace', async () => {

      const workspaceRoot = '/home/user/monorepo'
      mockFindUp.mockResolvedValue(`${workspaceRoot}/yarn.lock`)
      mockReadPackageAsync.mockResolvedValue({
        name: 'root',
        workspaces: ['apps/*', 'libs/*'],
      })

      const result = await resolveWorkspaceContextAsync(workspaceRoot)
      expect(result.manager).toBe('yarn')
      expect(result.workspaces).toEqual(['apps/*', 'libs/*'])

    })

    it('should detect npm workspace', async () => {

      const workspaceRoot = '/projects/app'
      mockFindUp.mockResolvedValue(`${workspaceRoot}/package-lock.json`)
      mockReadPackageAsync.mockResolvedValue({
        name: 'app',
        workspaces: ['modules/*'],
      })

      const result = await resolveWorkspaceContextAsync(workspaceRoot)
      expect(result.manager).toBe('npm')
      expect(result.rootDir).toBe(workspaceRoot)

    })

    it('should detect bun workspace', async () => {

      const workspaceRoot = '/dev/project'
      mockFindUp.mockResolvedValue(`${workspaceRoot}/bun.lock`)
      mockReadPackageAsync.mockResolvedValue({
        name: 'project',
        workspaces: ['src/*'],
      })

      const result = await resolveWorkspaceContextAsync(workspaceRoot)
      expect(result.manager).toBe('bun')

    })

    it('should throw error if no lockfile found', async () => {

      mockFindUp.mockResolvedValue(undefined)

      await expect(resolveWorkspaceContextAsync('/some/path'))
        .rejects
        .toThrow(WorkspaceError.get('noLockfile'))

    })

    it('should handle missing workspaces field', async () => {

      const workspaceRoot = '/standalone'
      mockFindUp.mockResolvedValue(`${workspaceRoot}/pnpm-lock.yaml`)
      mockReadPackageAsync.mockResolvedValue({ name: 'standalone' }) // без workspaces

      const result = await resolveWorkspaceContextAsync(workspaceRoot)
      expect(result.manager).toBe('pnpm')
      expect(result.workspaces).toBeUndefined()

    })

    it('should throw error for invalid workspaces format (object)', async () => {

      const workspaceRoot = '/bad/config'
      mockFindUp.mockResolvedValue(`${workspaceRoot}/yarn.lock`)
      mockReadPackageAsync.mockResolvedValue({
        name: 'bad',
        workspaces: { packages: ['apps/*'] } as unknown as string[],
      })

      await expect(resolveWorkspaceContextAsync(workspaceRoot))
        .rejects
        .toThrow(WorkspaceError.get('invalidWorkspaces', `${workspaceRoot}/package.json`))

    })

    it('should throw error for invalid workspaces format (non-string array)', async () => {

      const workspaceRoot = '/bad/config'
      mockFindUp.mockResolvedValue(`${workspaceRoot}/pnpm-lock.yaml`)
      mockReadPackageAsync.mockResolvedValue({
        name: 'bad',
        workspaces: ['valid', 123, null] as unknown as string[],
      })

      await expect(resolveWorkspaceContextAsync(workspaceRoot))
        .rejects
        .toThrow(WorkspaceError.get('invalidWorkspaces', `${workspaceRoot}/package.json`))

    })

    it('should normalize Windows paths correctly', async () => {

      const workspaceRoot = 'C:\\Users\\repos\\project'
      mockFindUp.mockResolvedValue(`${workspaceRoot}\\pnpm-lock.yaml`)
      mockReadPackageAsync.mockResolvedValue({
        name: 'win-project',
        workspaces: ['packages/*'],
      })

      const result = await resolveWorkspaceContextAsync(workspaceRoot)
      expect(result.rootDir).toBe(toPosix(workspaceRoot))
      expect(result.manager).toBe('pnpm')

    })

  })

})
