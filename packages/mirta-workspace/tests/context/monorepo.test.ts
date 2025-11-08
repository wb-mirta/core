import { glob } from 'node:fs/promises'
import { WorkspaceError } from '#errors'
import type { WorkspaceContext } from '#context/workspace'

vi.mock('node:fs/promises', () => ({
  glob: vi.fn(),
}))

vi.mock('@mirta/package', async () => {

  const actual = await vi.importActual<typeof import('@mirta/package')>('@mirta/package')

  return ({
    ...actual,
    readPackageAsync: vi.fn(),
  })

})

vi.mock('#context/workspace', () => ({
  resolveWorkspaceContextAsync: vi.fn(),
}))

// eslint-disable-next-line @typescript-eslint/require-await
async function* createAsyncIterator<T>(...items: T[]): NodeJS.AsyncIterator<T> {

  for (const item of items)
    yield item

}

const mockGlob = vi.mocked(glob)

const { readPackageAsync } = await import('@mirta/package')
const mockReadPackageAsync = vi.mocked(readPackageAsync)

const { resolveWorkspaceContextAsync } = await import('#context/workspace')
const mockResolveWorkspaceContext = vi.mocked(resolveWorkspaceContextAsync)

const {
  resolveMonorepoContextAsync,
  resolveMonorepoPackagesAsync,
  findMonorepoPackageByChunkName,
  mapChunkToPackage,
  __resetInternalState,
} = await import('#context/monorepo')

describe('monorepo utilities', () => {

  beforeEach(() => {

    vi.clearAllMocks()
    __resetInternalState()

  })

  describe('resolveMonorepoContextAsync', () => {

    it('should return full monorepo context when workspace and workspaces are valid', async () => {

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

  })

  describe('resolveMonorepoPackagesAsync', () => {

    it('should discover packages using glob patterns', async () => {

      const context: WorkspaceContext = {
        rootDir: '/monorepo',
        manager: 'pnpm',
        workspaces: ['packages/*', 'apps/*'],
      }

      mockGlob.mockReturnValue(
        createAsyncIterator(
          'packages/ui/package.json',
          'apps/web/package.json'
        )
      )

      mockReadPackageAsync
        .mockResolvedValueOnce({ name: '@scope/ui' })
        .mockResolvedValueOnce({ name: '@scope/web' })

      const result = await resolveMonorepoPackagesAsync(context)

      expect(result).toHaveLength(2)
      expect(result).toContainEqual({ name: '@scope/ui', workspacePath: 'packages/ui' })
      expect(result).toContainEqual({ name: '@scope/web', workspacePath: 'apps/web' })

    })

    it('should return empty packages array if workspaces is undefined', async () => {

      const context: WorkspaceContext = {
        rootDir: '/standalone',
        manager: 'npm',
        workspaces: undefined,
      }

      mockGlob.mockReturnValue(createAsyncIterator())

      const result = await resolveMonorepoPackagesAsync(context)

      expect(result).toHaveLength(0)
      expect(mockGlob).toHaveBeenCalledWith([], expect.objectContaining({
        exclude: ['node_modules/**'],
      }))

    })

    it('should sort packages by path length (longest first)', async () => {

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

    it('should sort packages lexicographically when paths have equal length', async () => {

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

      // Одинаковая длина → лексикографический порядок
      expect(result[0].workspacePath).toBe('packages/alpha')
      expect(result[1].workspacePath).toBe('packages/gamma')
      expect(result[2].workspacePath).toBe('packages/zebra')

    })

    it('should throw error if package name is missing', async () => {

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

  })

  describe('findMonorepoPackageByChunkName', () => {

    const mockContext = {
      rootDir: '/monorepo',
      manager: 'pnpm' as const,
      packages: [
        { name: '@scope/nested-lib', workspacePath: 'packages/nested/lib' },
        { name: '@scope/app', workspacePath: 'packages/app' },
        { name: '@scope/lib', workspacePath: 'packages/lib' },
      ],
    }

    it('should find package by chunk name prefix', () => {

      const result = findMonorepoPackageByChunkName(
        mockContext,
        'packages/app/src/index.ts'
      )
      expect(result).toEqual({ name: '@scope/app', workspacePath: 'packages/app' })

    })

    it('should match longest path first', () => {

      const result = findMonorepoPackageByChunkName(
        mockContext,
        'packages/nested/lib/src/utils.ts'
      )
      expect(result?.name).toBe('@scope/nested-lib')

    })

    it('should return undefined if no match found', () => {

      const result = findMonorepoPackageByChunkName(
        mockContext,
        'other/path/file.ts'
      )
      expect(result).toBeUndefined()

    })

    it('should work with exact path match', () => {

      const result = findMonorepoPackageByChunkName(
        mockContext,
        'packages/lib/index.ts'
      )
      expect(result?.name).toBe('@scope/lib')

    })

  })

  describe('mapChunkToPackage', () => {

    it('should map chunk to node_modules path', () => {

      const pkgDef = { name: '@scope/app', workspacePath: 'packages/app' }
      const result = mapChunkToPackage('packages/app/src/index.ts', pkgDef)
      expect(result).toBe('node_modules/@scope/app/src/index.ts')

    })

    it('should handle nested workspace paths', () => {

      const pkgDef = { name: '@org/nested', workspacePath: 'libs/nested/module' }
      const result = mapChunkToPackage('libs/nested/module/src/main.ts', pkgDef)
      expect(result).toBe('node_modules/@org/nested/src/main.ts')

    })

    it('should handle packages without scope', () => {

      const pkgDef = { name: 'simple-package', workspacePath: 'packages/simple' }
      const result = mapChunkToPackage('packages/simple/lib/index.ts', pkgDef)
      expect(result).toBe('node_modules/simple-package/lib/index.ts')

    })

    it('should handle root-level files', () => {

      const pkgDef = { name: '@scope/root', workspacePath: 'packages/root' }
      const result = mapChunkToPackage('packages/root/index.ts', pkgDef)
      expect(result).toBe('node_modules/@scope/root/index.ts')

    })

  })

})
