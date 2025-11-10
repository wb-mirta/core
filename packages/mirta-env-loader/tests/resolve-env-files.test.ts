import { existsSync } from 'node:fs'

vi.mock('node:fs', () => ({
  existsSync: vi.fn(),
}))

const mockExistsSync = vi.mocked(existsSync)

const { resolveEnvFiles } = await import('#src/load-env')

describe('resolveEnvFiles', () => {

  beforeEach(() => {

    vi.clearAllMocks()

  })

  describe('basic file resolution', () => {

    it('should resolve base .env file in cwd when mode is undefined', () => {

      mockExistsSync.mockReturnValue(true)

      const files = resolveEnvFiles({
        cwd: '/app',
        mode: undefined,
      })

      expect(files).toEqual(['/app/.env'])

    })

    it('should return empty array when no .env files exist', () => {

      mockExistsSync.mockReturnValue(false)

      const files = resolveEnvFiles({
        cwd: '/app',
        mode: 'development',
      })

      expect(files).toEqual([])

    })

  })

  describe('mode-specific file generation', () => {

    it('should generate full variant set (.env.mode.local → .env) for development mode', () => {

      mockExistsSync.mockReturnValue(true)

      const files = resolveEnvFiles({
        cwd: '/app',
        mode: 'development',
      })

      expect(files).toEqual([
        '/app/.env.development.local',
        '/app/.env.development',
        '/app/.env.local',
        '/app/.env',
      ])

    })

    it('should exclude .local files in test mode (both mode-specific and base)', () => {

      mockExistsSync.mockReturnValue(true)

      const files = resolveEnvFiles({
        cwd: '/app',
        mode: 'test',
      })

      expect(files).toEqual([
        '/app/.env.test',
        '/app/.env',
      ])
      expect(files).not.toContain('/app/.env.test.local')
      expect(files).not.toContain('/app/.env.local')

    })

    it('should generate correct variant set for production mode', () => {

      mockExistsSync.mockReturnValue(true)

      const files = resolveEnvFiles({
        cwd: '/app',
        mode: 'production',
      })

      expect(files).toEqual([
        '/app/.env.production.local',
        '/app/.env.production',
        '/app/.env.local',
        '/app/.env',
      ])

    })

    it('should support arbitrary modes (e.g. staging) with correct naming pattern', () => {

      mockExistsSync.mockReturnValue(true)

      const files = resolveEnvFiles({
        cwd: '/app',
        mode: 'staging',
      })

      expect(files).toEqual([
        '/app/.env.staging.local',
        '/app/.env.staging',
        '/app/.env.local',
        '/app/.env',
      ])

    })

  })

  describe('file resolution across directories', () => {

    it('should resolve .env files in both cwd and rootDir', () => {

      mockExistsSync.mockReturnValue(true)

      const files = resolveEnvFiles({
        cwd: '/monorepo/packages/app',
        rootDir: '/monorepo',
        mode: 'development',
      })

      // Файлы из cwd
      expect(files).toContain('/monorepo/packages/app/.env.development.local')
      expect(files).toContain('/monorepo/packages/app/.env.development')
      expect(files).toContain('/monorepo/packages/app/.env.local')
      expect(files).toContain('/monorepo/packages/app/.env')

      // Файлы из rootDir
      expect(files).toContain('/monorepo/.env.development.local')
      expect(files).toContain('/monorepo/.env.development')
      expect(files).toContain('/monorepo/.env.local')
      expect(files).toContain('/monorepo/.env')

      expect(files).toHaveLength(8)

    })

    it('should prioritize cwd-resolved files over rootDir-resolved files', () => {

      mockExistsSync.mockReturnValue(true)

      const files = resolveEnvFiles({
        cwd: '/monorepo/packages/app',
        rootDir: '/monorepo',
        mode: 'development',
      })

      const cwdFiles = files.filter(f => f.includes('/packages/app'))
      const rootFiles = files.filter(f => !f.includes('/packages/app'))

      const lastCwdIndex = files.indexOf(cwdFiles[cwdFiles.length - 1])
      const firstRootIndex = files.indexOf(rootFiles[0])

      expect(lastCwdIndex).toBeLessThan(firstRootIndex)

    })

    it('should avoid duplicate entries when cwd and rootDir are the same', () => {

      mockExistsSync.mockReturnValue(true)

      const files = resolveEnvFiles({
        cwd: '/app',
        rootDir: '/app',
        mode: 'development',
      })

      expect(files).toHaveLength(4)
      expect(new Set(files).size).toBe(4)

    })

    it('should not resolve files in rootDir when it is not provided', () => {

      mockExistsSync.mockReturnValue(true)

      const files = resolveEnvFiles({
        cwd: '/app',
        mode: 'development',
      })

      expect(files.every(f => f.startsWith('/app'))).toBe(true)
      expect(files).toHaveLength(4)

    })

  })

  describe('custom env file support', () => {

    it('should resolve custom envFile name (e.g. .env.custom)', () => {

      mockExistsSync.mockReturnValue(true)

      const files = resolveEnvFiles({
        cwd: '/app',
        mode: undefined,
        envFile: '.env.custom',
      })

      expect(files).toEqual(['/app/.env.custom'])

    })

    it('should resolve multiple envFile entries from array', () => {

      mockExistsSync.mockReturnValue(true)

      const files = resolveEnvFiles({
        cwd: '/app',
        mode: undefined,
        envFile: ['.env', '.env.backup'],
      })

      expect(files).toContain('/app/.env')
      expect(files).toContain('/app/.env.backup')

    })

    it('should generate mode variants for each custom envFile entry', () => {

      mockExistsSync.mockReturnValue(true)

      const files = resolveEnvFiles({
        cwd: '/app',
        mode: 'development',
        envFile: ['.env', '.env.backup'],
      })

      // Варианты для .env
      expect(files).toContain('/app/.env.development.local')
      expect(files).toContain('/app/.env.development')
      expect(files).toContain('/app/.env.local')
      expect(files).toContain('/app/.env')

      // Варианты для .env.backup
      expect(files).toContain('/app/.env.backup.development.local')
      expect(files).toContain('/app/.env.backup.development')
      expect(files).toContain('/app/.env.backup.local')
      expect(files).toContain('/app/.env.backup')

    })

    it('should deduplicate envFile array before processing', () => {

      mockExistsSync.mockReturnValue(true)

      const files = resolveEnvFiles({
        cwd: '/app',
        mode: undefined,
        envFile: ['.env', '.env', '.env'],
      })

      expect(files).toEqual(['/app/.env'])

    })

  })

  describe('filesystem existence checks', () => {

    it('should only include existing .env files in result', () => {

      mockExistsSync.mockImplementation((path) => {

        return path === '/app/.env' || path === '/app/.env.development'

      })

      const files = resolveEnvFiles({
        cwd: '/app',
        mode: 'development',
      })

      expect(files).toEqual([
        '/app/.env.development',
        '/app/.env',
      ])

    })

    it('should validate existence of all generated .env paths before including', () => {

      mockExistsSync.mockReturnValue(false)

      resolveEnvFiles({
        cwd: '/app',
        rootDir: '/root',
        mode: 'development',
      })

      // 4 файла в cwd + 4 файла в rootDir = 8 вызовов
      expect(mockExistsSync).toHaveBeenCalledTimes(8)

    })

  })

})
