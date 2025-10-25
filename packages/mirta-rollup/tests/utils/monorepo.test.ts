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

  const originalPnpmHome = process.env.PNPM_HOME

  beforeEach(() => {

    vi.clearAllMocks()
    process.env.PNPM_HOME = '/usr/local/pnpm'

  })

  afterEach(() => {

    process.env.PNPM_HOME = originalPnpmHome

  })

  describe('findMonorepoDirAsync', () => {

    it('должен найти директорию монорепозитория с PNPM', async () => {

      const expectedDir = '/home/user/my-monorepo'
      pnpmFindWorkspaceDir.mockResolvedValue(expectedDir)

      const result = await findMonorepoDirAsync('/home/user/my-monorepo/packages/app')

      expect(pnpmFindWorkspaceDir).toHaveBeenCalledWith('/home/user/my-monorepo/packages/app')
      expect(result).toBe(expectedDir)

    })

    it('должен вернуть undefined если монорепозиторий не найден', async () => {

      pnpmFindWorkspaceDir.mockResolvedValue(undefined)

      const result = await findMonorepoDirAsync('/home/user/standalone-project')

      expect(result).toBeUndefined()

    })

    it('должен выбросить ошибку если PNPM_HOME не установлен', async () => {

      delete process.env.PNPM_HOME

      await expect(findMonorepoDirAsync('/some/path'))
        .rejects
        .toThrow(PackageManagerError.get('pnpmOnly'))

    })

  })

  describe('getMonorepoContextAsync', () => {

    it('должен вернуть контекст монорепозитория с пакетами', async () => {

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

    it('должен отсортировать пакеты по длине пути (самые длинные первыми)', async () => {

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

    it('должен вернуть undefined если не является монорепозиторием', async () => {

      pnpmFindWorkspaceDir.mockResolvedValue(undefined)

      const result = await getMonorepoContextAsync('/standalone/project')

      expect(result).toBeUndefined()

    })

    it('должен выбросить ошибку если workspaces не определены', async () => {

      const monorepoDir = '/home/user/monorepo'
      pnpmFindWorkspaceDir.mockResolvedValue(monorepoDir)
      mockParsePackageJson.mockReturnValue({
        name: 'root',
      })

      await expect(getMonorepoContextAsync(monorepoDir))
        .rejects
        .toThrow(WorkspaceError.get('noWorkspaces'))

    })

    it('должен исключить корневую директорию из списка пакетов', async () => {

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

    it('должен обрабатывать пакеты без имени', async () => {

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

    it('должен найти пакет по имени чанка', () => {

      const result = findMonorepoPackageByChunkName(
        mockContext,
        'packages/app/src/index.ts'
      )

      expect(result).toBeDefined()
      expect(result?.name).toBe('@scope/app')
      expect(result?.workspacePath).toBe('packages/app/')

    })

    it('должен найти самый длинный совпадающий путь', () => {

      const result = findMonorepoPackageByChunkName(
        mockContext,
        'packages/nested/lib/src/utils.ts'
      )

      expect(result?.name).toBe('@scope/nested-lib')
      expect(result?.workspacePath).toBe('packages/nested/lib/')

    })

    it('должен вернуть undefined если пакет не найден', () => {

      const result = findMonorepoPackageByChunkName(
        mockContext,
        'other/path/file.ts'
      )

      expect(result).toBeUndefined()

    })

    it('должен работать с точным совпадением пути', () => {

      const result = findMonorepoPackageByChunkName(
        mockContext,
        'packages/lib/index.ts'
      )

      expect(result?.name).toBe('@scope/lib')

    })

  })

  describe('mapChunkToPackage', () => {

    it('должен преобразовать путь чанка в путь node_modules', () => {

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

    it('должен обрабатывать вложенные пути', () => {

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

    it('должен выбросить ошибку если имя пакета отсутствует', () => {

      const pkgDefinition = {
        workspacePath: 'packages/unnamed/',
      }

      expect(() => mapChunkToPackage('packages/unnamed/index.ts', pkgDefinition))
        .toThrow(WorkspaceError.get('noPackageName', 'packages/unnamed/'))

    })

    it('должен обрабатывать пакеты с простыми именами (без @scope)', () => {

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
