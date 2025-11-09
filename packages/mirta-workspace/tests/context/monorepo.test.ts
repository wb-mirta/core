import { glob } from 'node:fs/promises'
import { WorkspaceError } from '#errors'
import type { WorkspaceContext } from '#context/workspace'

// Mocks
vi.mock('node:fs/promises', () => ({
  glob: vi.fn(),
}))

vi.mock('@mirta/package', async () => {

  const actual = await vi.importActual<typeof import('@mirta/package')>('@mirta/package')
  return {
    ...actual,
    readPackageAsync: vi.fn(),
  }

})

vi.mock('#context/workspace', () => ({
  resolveWorkspaceContextAsync: vi.fn(),
}))

// Helper
// eslint-disable-next-line @typescript-eslint/require-await
async function* createAsyncIterator<T>(...items: T[]): NodeJS.AsyncIterator<T> {

  for (const item of items)
    yield item

}

// Mocked imports
const mockGlob = vi.mocked(glob)
const { readPackageAsync } = await import('@mirta/package')
const mockReadPackageAsync = vi.mocked(readPackageAsync)
const { resolveWorkspaceContextAsync } = await import('#context/workspace')
const mockResolveWorkspaceContext = vi.mocked(resolveWorkspaceContextAsync)

const { resolveMonorepoContextAsync, resolveMonorepoPackagesAsync, __resetInternalState }
  = await import('#context/monorepo')

describe('monorepo utilities', () => {

  beforeEach(() => {

    vi.clearAllMocks()
    __resetInternalState()

  })

  describe('resolveMonorepoContextAsync', () => {

    it('should return full monorepo context with resolved packages', async () => {

      const rootDir = '/home/user/monorepo'
      const workspaceContext: WorkspaceContext = {
        rootDir,
        manager: 'pnpm',
        workspaces: ['packages/*'],
      }

      mockResolveWorkspaceContext.mockResolvedValue(workspaceContext)
      mockGlob.mockReturnValue(createAsyncIterator('packages/app/package.json'))
      mockReadPackageAsync.mockResolvedValue({ name: '@scope/app' })

      const result = await resolveMonorepoContextAsync(rootDir)

      expect(result).toEqual({
        rootDir,
        manager: 'pnpm',
        packages: [{ name: '@scope/app', workspacePath: 'packages/app' }],
      })

    })

    it('should propagate workspace resolution errors', async () => {

      const error = WorkspaceError.get('noLockfile')
      mockResolveWorkspaceContext.mockRejectedValue(error)

      await expect(resolveMonorepoContextAsync('/some/path')).rejects.toThrow(error)

    })

  })

  describe('resolveMonorepoPackagesAsync', () => {

    it('should discover packages using workspace glob patterns', async () => {

      const context: WorkspaceContext = {
        rootDir: '/monorepo',
        manager: 'pnpm',
        workspaces: ['packages/*', 'apps/*'],
      }

      mockGlob.mockReturnValue(
        createAsyncIterator('packages/ui/package.json', 'apps/web/package.json')
      )

      mockReadPackageAsync
        .mockResolvedValueOnce({ name: '@scope/ui' })
        .mockResolvedValueOnce({ name: '@scope/web' })

      const result = await resolveMonorepoPackagesAsync(context)

      expect(result).toHaveLength(2)
      expect(result).toContainEqual({ name: '@scope/ui', workspacePath: 'packages/ui' })
      expect(result).toContainEqual({ name: '@scope/web', workspacePath: 'apps/web' })

    })

    it('should return empty array when workspaces is undefined', async () => {

      const context: WorkspaceContext = {
        rootDir: '/standalone',
        manager: 'npm',
        workspaces: undefined,
      }

      mockGlob.mockReturnValue(createAsyncIterator())
      const result = await resolveMonorepoPackagesAsync(context)

      expect(result).toEqual([])
      expect(mockGlob).toHaveBeenCalledWith([], expect.objectContaining({
        exclude: ['node_modules/**'],
      }))

    })

    it('should sort packages by path length descending (longest first)', async () => {

      const context: WorkspaceContext = {
        rootDir: '/monorepo',
        manager: 'yarn',
        workspaces: ['packages/*', 'packages/nested/*'],
      }

      mockGlob.mockReturnValue(
        createAsyncIterator(
          'packages/a/package.json',
          'packages/nested/b/package.json',
          'packages/c/package.json'
        )
      )

      mockReadPackageAsync
        .mockResolvedValueOnce({ name: 'pkg-a' })
        .mockResolvedValueOnce({ name: 'pkg-b' })
        .mockResolvedValueOnce({ name: 'pkg-c' })

      const result = await resolveMonorepoPackagesAsync(context)

      expect(result[0].workspacePath).toBe('packages/nested/b')
      expect(result[1].workspacePath).toBe('packages/a')
      expect(result[2].workspacePath).toBe('packages/c')

    })

    it('should sort lexicographically when path lengths are equal', async () => {

      const context: WorkspaceContext = {
        rootDir: '/monorepo',
        manager: 'pnpm',
        workspaces: ['packages/*'],
      }

      mockGlob.mockReturnValue(
        createAsyncIterator(
          'packages/zebra/package.json',
          'packages/alpha/package.json',
          'packages/gamma/package.json'
        )
      )

      mockReadPackageAsync
        .mockResolvedValueOnce({ name: 'zebra' })
        .mockResolvedValueOnce({ name: 'alpha' })
        .mockResolvedValueOnce({ name: 'gamma' })

      const result = await resolveMonorepoPackagesAsync(context)

      expect(result[0].workspacePath).toBe('packages/alpha')
      expect(result[1].workspacePath).toBe('packages/gamma')
      expect(result[2].workspacePath).toBe('packages/zebra')

    })

    it('should throw error when package has no name', async () => {

      const context: WorkspaceContext = {
        rootDir: '/monorepo',
        manager: 'pnpm',
        workspaces: ['packages/*'],
      }

      mockGlob.mockReturnValue(createAsyncIterator('packages/unnamed/package.json'))
      mockReadPackageAsync.mockResolvedValue({ name: undefined })

      await expect(resolveMonorepoPackagesAsync(context))
        .rejects
        .toThrow(WorkspaceError.get('noPackageName', 'packages/unnamed/package.json'))

    })

    it('should cache results by rootDir', async () => {

      const context: WorkspaceContext = {
        rootDir: '/cached',
        manager: 'npm',
        workspaces: ['libs/*'],
      }

      mockGlob.mockReturnValue(createAsyncIterator('libs/util/package.json'))
      mockReadPackageAsync.mockResolvedValue({ name: 'util' })

      const result1 = await resolveMonorepoPackagesAsync(context)
      const result2 = await resolveMonorepoPackagesAsync(context)

      expect(result1).toBe(result2)
      expect(mockGlob).toHaveBeenCalledTimes(1)

    })

    it('should normalize Windows paths to POSIX', async () => {

      const context: WorkspaceContext = {
        rootDir: 'C:\\monorepo',
        manager: 'pnpm',
        workspaces: ['packages\\*'],
      }

      mockGlob.mockReturnValue(createAsyncIterator('packages\\app\\package.json'))
      mockReadPackageAsync.mockResolvedValue({ name: 'app' })

      const result = await resolveMonorepoPackagesAsync(context)

      expect(result[0].workspacePath).toBe('packages/app')

    })

    it('should exclude node_modules from glob search', async () => {

      const context: WorkspaceContext = {
        rootDir: '/monorepo',
        manager: 'yarn',
        workspaces: ['**/*'],
      }

      mockGlob.mockReturnValue(createAsyncIterator())
      await resolveMonorepoPackagesAsync(context)

      expect(mockGlob).toHaveBeenCalledWith(
        ['**/*/package.json'],
        expect.objectContaining({ exclude: ['node_modules/**'] })
      )

    })

    it('should handle multiple workspace patterns', async () => {

      const context: WorkspaceContext = {
        rootDir: '/complex',
        manager: 'pnpm',
        workspaces: ['packages/*', 'apps/*', 'tools/*'],
      }

      mockGlob.mockReturnValue(
        createAsyncIterator(
          'packages/core/package.json',
          'apps/web/package.json',
          'tools/cli/package.json'
        )
      )

      mockReadPackageAsync
        .mockResolvedValueOnce({ name: '@mono/core' })
        .mockResolvedValueOnce({ name: '@mono/web' })
        .mockResolvedValueOnce({ name: '@mono/cli' })

      const result = await resolveMonorepoPackagesAsync(context)

      expect(result).toHaveLength(3)

    })

    it('should call glob with correct patterns and cwd', async () => {

      const context: WorkspaceContext = {
        rootDir: '/monorepo',
        manager: 'pnpm',
        workspaces: ['packages/*', 'apps/*'],
      }

      mockGlob.mockReturnValue(createAsyncIterator('packages/ui/package.json'))

      await resolveMonorepoPackagesAsync(context)

      expect(mockGlob).toHaveBeenCalledWith(
        ['packages/*/package.json', 'apps/*/package.json'],
        expect.objectContaining({
          cwd: '/monorepo',
          exclude: ['node_modules/**'],
        })
      )

    })

  })

})
