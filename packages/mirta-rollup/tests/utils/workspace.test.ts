import nodePath from 'node:path'
import { findUp } from 'find-up'
import { WorkspaceError } from '#utils/errors'

vi.mock('find-up', () => ({
  findUp: vi.fn(),
}))

vi.mock('#utils/package', () => ({
  parsePackageJson: vi.fn(),
}))

const mockFindUp = vi.mocked(findUp)
const { parsePackageJson } = await import('#utils/package')
const mockParsePackageJson = vi.mocked(parsePackageJson)

const {
  resolveWorkspaceContextAsync,
} = await import('#utils/workspace')

describe('workspace utilities', () => {

  beforeEach(() => {

    vi.clearAllMocks()

  })

  describe('resolveWorkspaceContextAsync', () => {

    it('should detect pnpm workspace', async () => {

      const workspaceRoot = '/home/user/monorepo'

      mockFindUp.mockResolvedValue(`${workspaceRoot}/pnpm-lock.yaml`)

      mockParsePackageJson.mockReturnValue({
        name: 'root',
        workspaces: ['packages/*'],
      })

      const result = await resolveWorkspaceContextAsync(`${workspaceRoot}/packages/app`)

      expect(result).toEqual({
        rootDir: workspaceRoot,
        manager: 'pnpm',
        workspaces: ['packages/*'],
      })

      expect(mockParsePackageJson).toHaveBeenCalledWith(
        nodePath.join(workspaceRoot, 'package.json')
      )

    })

    it('should detect yarn workspace', async () => {

      const workspaceRoot = '/home/user/monorepo'
      mockFindUp.mockResolvedValue(`${workspaceRoot}/yarn.lock`)
      mockParsePackageJson.mockReturnValue({
        name: 'root',
        workspaces: ['apps/*', 'libs/*'],
      })

      const result = await resolveWorkspaceContextAsync(workspaceRoot)

      expect(result?.manager).toBe('yarn')
      expect(result?.workspaces).toEqual(['apps/*', 'libs/*'])

    })

    it('should detect npm workspace', async () => {

      const workspaceRoot = '/projects/app'
      mockFindUp.mockResolvedValue(`${workspaceRoot}/package-lock.json`)
      mockParsePackageJson.mockReturnValue({
        name: 'app',
        workspaces: ['modules/*'],
      })

      const result = await resolveWorkspaceContextAsync(workspaceRoot)

      expect(result?.manager).toBe('npm')
      expect(result?.rootDir).toBe(workspaceRoot)

    })

    it('should detect bun workspace', async () => {

      const workspaceRoot = '/dev/project'
      mockFindUp.mockResolvedValue(`${workspaceRoot}/bun.lock`)
      mockParsePackageJson.mockReturnValue({
        name: 'project',
        workspaces: ['src/*'],
      })

      const result = await resolveWorkspaceContextAsync(workspaceRoot)

      expect(result?.manager).toBe('bun')

    })

    it('should return undefined if no lock file found', async () => {

      mockFindUp.mockResolvedValue(undefined)

      const result = await resolveWorkspaceContextAsync('/some/path')

      expect(result).toBeUndefined()

    })

    it('should handle workspace without workspaces field', async () => {

      const workspaceRoot = '/standalone/project'
      mockFindUp.mockResolvedValue(`${workspaceRoot}/pnpm-lock.yaml`)
      mockParsePackageJson.mockReturnValue({
        name: 'standalone',
      })

      const result = await resolveWorkspaceContextAsync(workspaceRoot)

      expect(result).toEqual({
        rootDir: workspaceRoot,
        manager: 'pnpm',
        workspaces: undefined,
      })

    })

    it('should throw error for invalid workspaces format (object)', async () => {

      const workspaceRoot = '/bad/config'
      mockFindUp.mockResolvedValue(`${workspaceRoot}/yarn.lock`)

      mockParsePackageJson.mockReturnValue({
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
      mockParsePackageJson.mockReturnValue({
        name: 'bad',
        workspaces: ['valid', 123, null] as unknown as string[],
      })

      await expect(resolveWorkspaceContextAsync(workspaceRoot))
        .rejects
        .toThrow(WorkspaceError.get('invalidWorkspaces', `${workspaceRoot}/package.json`))

    })

    it('should accept undefined workspaces', async () => {

      const workspaceRoot = '/project'

      mockFindUp.mockResolvedValue(`${workspaceRoot}/package-lock.json`)

      mockParsePackageJson.mockReturnValue({
        name: 'project',
      })

      const result = await resolveWorkspaceContextAsync(workspaceRoot)

      expect(result?.workspaces).toBeUndefined()

    })

    it('should normalize Windows paths correctly', async () => {

      const workspaceRoot = 'C:\\Users\\repos\\project'
      mockFindUp.mockResolvedValue(`${workspaceRoot}\\pnpm-lock.yaml`)
      mockParsePackageJson.mockReturnValue({
        name: 'win-project',
        workspaces: ['packages\\*'],
      })

      const result = await resolveWorkspaceContextAsync(workspaceRoot)

      expect(result?.rootDir).toBe(workspaceRoot)
      expect(result?.manager).toBe('pnpm')

    })

  })

})
