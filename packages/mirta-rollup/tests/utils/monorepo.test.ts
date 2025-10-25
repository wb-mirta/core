import { mock } from 'vitest-mock-extended'

import type { Project, ProjectManifest, ProjectRootDir, ProjectRootDirRealPath } from '@pnpm/types'
import { PackageManagerError, WorkspaceError } from '#utils/errors'

// Мокаем внешние зависимости
vi.mock('@pnpm/find-workspace-dir', () => ({
  findWorkspaceDir: vi.fn(),
}))

vi.mock('@pnpm/workspace.find-packages', () => ({
  findWorkspacePackages: vi.fn(),
}))

vi.mock('#utils/package', () => ({
  parsePackageJson: vi.fn(),
}))

const { findWorkspaceDir } = await import('@pnpm/find-workspace-dir')
const { findWorkspacePackages } = await import('@pnpm/workspace.find-packages')
const { parsePackageJson } = await import('#utils/package')

const pnpmFindWorkspaceDir = vi.mocked(findWorkspaceDir)
const pnpmFindWorkspacePackages = vi.mocked(findWorkspacePackages)
const mockParsePackageJson = vi.mocked(parsePackageJson)

const {
  findMonorepoDirAsync,
  getMonorepoContextAsync,
  findMonorepoPackageByChunkName,
  mapChunkToPackage,
} = await import('#utils/monorepo')

function mockProject(mockImplementation: { rootDir: string, manifest: ProjectManifest }) {

  return mock<Project>({
    rootDir: mockImplementation.rootDir as ProjectRootDir,
    manifest: mockImplementation.manifest,
  })

}

describe('monorepo utilities', () => {

  beforeEach(() => {

    vi.clearAllMocks()
    vi.stubEnv('PNPM_HOME', '/usr/local/pnpm')

  })

  afterEach(() => {

    vi.unstubAllEnvs()

  })

  describe('findMonorepoDirAsync', () => {

    it('should find monorepo directory with PNPM', async () => {

      const expectedDir = '/home/user/my-monorepo'
      pnpmFindWorkspaceDir.mockResolvedValue(expectedDir)

      const result = await findMonorepoDirAsync('/home/user/my-monorepo/packages/app')

      expect(pnpmFindWorkspaceDir).toHaveBeenCalledWith('/home/user/my-monorepo/packages/app')
      expect(result).toBe(expectedDir)

    })

    it('should return undefined if monorepo is not found', async () => {

      pnpmFindWorkspaceDir.mockResolvedValue(undefined)

      const result = await findMonorepoDirAsync('/home/user/standalone-project')

      expect(result).toBeUndefined()

    })

    it('should throw error if PNPM_HOME is not set', async () => {

      delete process.env.PNPM_HOME

      await expect(findMonorepoDirAsync('/some/path'))
        .rejects
        .toThrow(PackageManagerError.get('pnpmOnly'))

    })

  })

  describe('getMonorepoContextAsync', () => {

    it('should return monorepo context with packages', async () => {

      const monorepoDir = '/home/user/monorepo'
      const mockPackages: Project[] = [
        {
          rootDir: monorepoDir as ProjectRootDir,
          rootDirRealPath: '' as ProjectRootDirRealPath,
          manifest: { name: 'root' },
          writeProjectManifest: vi.fn(),
        },
        {
          rootDir: `${monorepoDir}/packages/app` as ProjectRootDir,
          rootDirRealPath: '' as ProjectRootDirRealPath,
          manifest: { name: '@scope/app' },
          writeProjectManifest: vi.fn(),
        },
        {
          rootDir: `${monorepoDir}/packages/lib` as ProjectRootDir,
          rootDirRealPath: '' as ProjectRootDirRealPath,
          manifest: { name: '@scope/lib' },
          writeProjectManifest: vi.fn(),
        },
      ]

      pnpmFindWorkspaceDir.mockResolvedValue(monorepoDir)
      mockParsePackageJson.mockReturnValue({
        name: 'root',
        workspaces: ['packages/*'],
      })
      pnpmFindWorkspacePackages.mockResolvedValue(mockPackages)

      const result = await getMonorepoContextAsync(monorepoDir)

      expect(result).toBeDefined()
      expect(result?.rootDir).toBe(monorepoDir)
      expect(result?.packages).toHaveLength(2)
      expect(result?.packages[0].name).toBe('@scope/app')
      expect(result?.packages[0].workspacePath).toBe('packages/app/')
      expect(result?.packages[1].name).toBe('@scope/lib')
      expect(result?.packages[1].workspacePath).toBe('packages/lib/')

    })

    it('should sort packages by path length (longest first)', async () => {

      const monorepoDir = '/home/user/monorepo'
      const mockPackages: Project[] = [
        mockProject({
          rootDir: monorepoDir as ProjectRootDir,
          manifest: { name: 'root' },
        }),
        mockProject({
          rootDir: `${monorepoDir}/packages/app`,
          manifest: { name: '@scope/app' },
        }),
        mockProject({
          rootDir: `${monorepoDir}/packages/nested/lib`,
          manifest: { name: '@scope/nested-lib' },
        }),
      ]

      pnpmFindWorkspaceDir.mockResolvedValue(monorepoDir)
      mockParsePackageJson.mockReturnValue({
        name: 'root',
        workspaces: ['packages/*', 'packages/nested/*'],
      })
      pnpmFindWorkspacePackages.mockResolvedValue(mockPackages)

      const result = await getMonorepoContextAsync(monorepoDir)

      expect(result?.packages[0].workspacePath).toBe('packages/nested/lib/')
      expect(result?.packages[1].workspacePath).toBe('packages/app/')

    })

    it('should return undefined if not a monorepo', async () => {

      pnpmFindWorkspaceDir.mockResolvedValue(undefined)

      const result = await getMonorepoContextAsync('/standalone/project')

      expect(result).toBeUndefined()

    })

    it('should throw error if workspaces are not defined', async () => {

      const monorepoDir = '/home/user/monorepo'
      pnpmFindWorkspaceDir.mockResolvedValue(monorepoDir)
      mockParsePackageJson.mockReturnValue({
        name: 'root',
      })

      await expect(getMonorepoContextAsync(monorepoDir))
        .rejects
        .toThrow(WorkspaceError.get('noWorkspaces'))

    })

    it('should exclude root directory from package list', async () => {

      const monorepoDir = '/home/user/monorepo'
      const mockPackages = [
        mockProject({
          rootDir: monorepoDir,
          manifest: { name: 'root' },
        }),
        mockProject({
          rootDir: `${monorepoDir}/packages/app`,
          manifest: { name: '@scope/app' },
        }),
      ]

      pnpmFindWorkspaceDir.mockResolvedValue(monorepoDir)
      mockParsePackageJson.mockReturnValue({
        name: 'root',
        workspaces: ['packages/*'],
      })
      pnpmFindWorkspacePackages.mockResolvedValue(mockPackages)

      const result = await getMonorepoContextAsync(monorepoDir)

      expect(result?.packages).toHaveLength(1)
      expect(result?.packages.every(pkg => pkg.name !== 'root')).toBe(true)

    })

    it('should handle packages without names', async () => {

      const monorepoDir = '/home/user/monorepo'
      const mockPackages = [
        mockProject({
          rootDir: monorepoDir,
          manifest: { name: 'root' },
        }),
        mockProject({
          rootDir: `${monorepoDir}/packages/unnamed`,
          manifest: { name: undefined },
        }),
      ]

      pnpmFindWorkspaceDir.mockResolvedValue(monorepoDir)
      mockParsePackageJson.mockReturnValue({
        name: 'root',
        workspaces: ['packages/*'],
      })
      pnpmFindWorkspacePackages.mockResolvedValue(mockPackages)

      const result = await getMonorepoContextAsync(monorepoDir)

      expect(result?.packages[0].name).toBeUndefined()
      expect(result?.packages[0].workspacePath).toBe('packages/unnamed/')

    })

  })

  describe('findMonorepoPackageByChunkName', () => {

    const mockContext = {
      rootDir: '/home/user/monorepo',
      packages: [
        {
          workspacePath: 'packages/nested/lib/',
          name: '@scope/nested-lib',
        },
        {
          workspacePath: 'packages/app/',
          name: '@scope/app',
        },
        {
          workspacePath: 'packages/lib/',
          name: '@scope/lib',
        },
      ],
    }

    it('should find package by chunk name', () => {

      const result = findMonorepoPackageByChunkName(
        mockContext,
        'packages/app/src/index.ts'
      )

      expect(result).toBeDefined()
      expect(result?.name).toBe('@scope/app')
      expect(result?.workspacePath).toBe('packages/app/')

    })

    it('should find longest matching path', () => {

      const result = findMonorepoPackageByChunkName(
        mockContext,
        'packages/nested/lib/src/utils.ts'
      )

      expect(result?.name).toBe('@scope/nested-lib')
      expect(result?.workspacePath).toBe('packages/nested/lib/')

    })

    it('should return undefined if package is not found', () => {

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

    it('should convert chunk path to node_modules path', () => {

      const pkgDefinition = {
        workspacePath: 'packages/app/',
        name: '@scope/app',
      }

      const result = mapChunkToPackage(
        'packages/app/src/index.ts',
        pkgDefinition
      )

      expect(result).toBe('node_modules/@scope/app/src/index.ts')

    })

    it('should handle nested paths', () => {

      const pkgDefinition = {
        workspacePath: 'packages/nested/lib/',
        name: '@scope/nested-lib',
      }

      const result = mapChunkToPackage(
        'packages/nested/lib/src/utils/helper.ts',
        pkgDefinition
      )

      expect(result).toBe('node_modules/@scope/nested-lib/src/utils/helper.ts')

    })

    it('should throw error if package name is missing', () => {

      const pkgDefinition = {
        workspacePath: 'packages/unnamed/',
      }

      expect(() => mapChunkToPackage('packages/unnamed/index.ts', pkgDefinition))
        .toThrow(WorkspaceError.get('noPackageName', 'packages/unnamed/'))

    })

    it('should handle packages with simple names (without @scope)', () => {

      const pkgDefinition = {
        workspacePath: 'packages/simple/',
        name: 'simple-package',
      }

      const result = mapChunkToPackage(
        'packages/simple/lib/index.ts',
        pkgDefinition
      )

      expect(result).toBe('node_modules/simple-package/lib/index.ts')

    })

  })

})
