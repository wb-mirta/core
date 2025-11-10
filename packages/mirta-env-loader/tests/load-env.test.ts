import type { DotenvConfigOptions } from '@dotenvx/dotenvx'
import { ensureArray } from '@mirta/basics/array'
import { existsSync } from 'node:fs'

vi.mock('node:fs', () => ({
  existsSync: vi.fn(),
}))

vi.mock('@dotenvx/dotenvx', () => ({
  default: {
    config: vi.fn(),
  },
}))

const mockExistsSync = vi.mocked(existsSync)
const dotenvx = await import('@dotenvx/dotenvx')
const mockDotenvxConfig = vi.mocked(dotenvx.default.config)

function mockDotenvxConfigWithEnv(env: Record<string, string> = {}) {

  mockDotenvxConfig.mockImplementation((config) => {

    if (config?.processEnv) {

      Object.assign(config.processEnv, env)

    }
    return {}

  })

}

function withConfigPath(
  callback: (config: DotenvConfigOptions) => void
) {

  const [config] = mockDotenvxConfig.mock.lastCall ?? []

  expect(config).toBeDefined()

  if (!config)
    return

  expect(config.path).toBeDefined()

  if (!config.path)
    return

  callback(config)

}

const { loadEnv } = await import('#src/load-env')

describe('loadEnv', () => {

  const originalEnv = process.env
  const originalCwd = process.cwd()

  beforeEach(() => {

    vi.clearAllMocks()

    // ⚠️ БЕЗОПАСНОСТЬ: Полностью заменяем process.env на контролируемый набор
    // Это предотвращает утечку системных переменных в логи при падении тестов
    //
    process.env = {
      NODE_ENV: 'development', // только необходимый минимум.
    }

    vi.spyOn(process, 'cwd').mockReturnValue('/test/project')

  })

  afterEach(() => {

    process.env = originalEnv
    vi.spyOn(process, 'cwd').mockReturnValue(originalCwd)

  })

  describe('basic functionality', () => {

    it('should load environment variables from .env file', () => {

      mockExistsSync.mockReturnValue(true)

      mockDotenvxConfigWithEnv({
        MIRTA_TEST: 'value1',
        APP_PORT: '3000',
      })

      const env = loadEnv({ cwd: '/test/project', keepNodeEnv: false })

      expect(env).toEqual({
        APP_PORT: '3000',
        MIRTA_TEST: 'value1',
      })

    })

    it('should use process.cwd() as default cwd', () => {

      mockExistsSync.mockReturnValue(true)

      mockDotenvxConfigWithEnv({
        MIRTA_VALUE: 'test',
      })

      loadEnv()

      expect(mockDotenvxConfig).toHaveBeenCalledWith(
        expect.objectContaining({
          path: expect.arrayContaining([
            expect.stringContaining('/test/project/.env'),
          ]) as unknown,
        })
      )

    })

    it('should use process.env.NODE_ENV as default mode', () => {

      process.env.NODE_ENV = 'production'

      mockExistsSync.mockReturnValue(true)

      mockDotenvxConfigWithEnv({
        MIRTA_TEST: 'production',
      })

      loadEnv()

      expect(mockDotenvxConfig).toHaveBeenCalledWith(
        expect.objectContaining({
          path: expect.arrayContaining([
            expect.stringContaining('.env.production'),
          ]) as unknown,
        })
      )

    })

    it('should return empty object when no .env files are found', () => {

      mockExistsSync.mockReturnValue(false)

      const env = loadEnv({ cwd: '/test/project', keepNodeEnv: false })

      expect(env).toEqual({})
      expect(mockDotenvxConfig).not.toHaveBeenCalled()

    })

  })

  describe('prefix-based filtering', () => {

    beforeEach(() => {

      mockExistsSync.mockReturnValue(true)

    })

    it('should include only environment variables matching default prefixes (MIRTA_, APP_)', () => {

      mockDotenvxConfigWithEnv({
        MIRTA_TEST: 'value',
        APP_PORT: '3000',
        OTHER_VAR: 'ignored',
        RANDOM: 'ignored',
      })

      const env = loadEnv({ keepNodeEnv: false })

      expect(env).toEqual({
        APP_PORT: '3000',
        MIRTA_TEST: 'value',
      })

      expect(env).not.toHaveProperty('OTHER_VAR')
      expect(env).not.toHaveProperty('RANDOM')

    })

    it('should respect custom prefix when filtering environment variables', () => {

      mockDotenvxConfigWithEnv({
        CUSTOM_VAR: 'included',
        MIRTA_TEST: 'excluded',
        APP_PORT: 'excluded',
      })

      const env = loadEnv({ prefix: 'CUSTOM_', keepNodeEnv: false })

      expect(env).toEqual({
        CUSTOM_VAR: 'included',
      })

    })

    it('should support multiple prefixes in array form', () => {

      mockDotenvxConfigWithEnv({
        PREFIX1_VAR: 'included1',
        PREFIX2_VAR: 'included2',
        OTHER_VAR: 'excluded',
      })

      const env = loadEnv({ prefix: ['PREFIX1_', 'PREFIX2_'], keepNodeEnv: false })

      expect(env).toEqual({
        PREFIX1_VAR: 'included1',
        PREFIX2_VAR: 'included2',
      })

    })

    it('should exclude variables with undefined values', () => {

      mockDotenvxConfigWithEnv({
        MIRTA_DEFINED: 'value',
        MIRTA_UNDEFINED: undefined as unknown as string,
      })

      const env = loadEnv({ keepNodeEnv: false })

      expect(env).toEqual({
        MIRTA_DEFINED: 'value',
      })

      expect(env).not.toHaveProperty('MIRTA_UNDEFINED')

    })

  })

  describe('mode-based file resolution', () => {

    beforeEach(() => {

      mockExistsSync.mockReturnValue(true)

    })

    it('should load files in correct order for development', () => {

      loadEnv({ mode: 'development', cwd: '/app' })

      expect(mockDotenvxConfig).toHaveBeenCalledWith(
        expect.objectContaining({
          path: [
            '/app/.env.development.local',
            '/app/.env.development',
            '/app/.env.local',
            '/app/.env',
          ],
        })
      )

    })

    it('should exclude .local files in test mode', () => {

      loadEnv({ mode: 'test', cwd: '/app' })

      expect(mockDotenvxConfig).toHaveBeenCalledWith(
        expect.objectContaining({
          path: expect.arrayContaining([
            '/app/.env.test',
            '/app/.env',
          ]) as unknown,
        })
      )

      const [config] = mockDotenvxConfig.mock.lastCall ?? []

      expect(config?.path).not.toContain('/app/.env.test.local')
      expect(config?.path).not.toContain('/app/.env.local')

    })

    it('should load only base .env file when mode is undefined', () => {

      delete process.env.NODE_ENV

      loadEnv({ mode: undefined, cwd: '/app' })

      expect(mockDotenvxConfig).toHaveBeenCalledWith(
        expect.objectContaining({
          path: ['/app/.env'],
        })
      )

    })

    it('should resolve files correctly for custom modes (e.g. staging)', () => {

      loadEnv({ mode: 'staging', cwd: '/app' })

      expect(mockDotenvxConfig).toHaveBeenCalledWith(
        expect.objectContaining({
          path: [
            '/app/.env.staging.local',
            '/app/.env.staging',
            '/app/.env.local',
            '/app/.env',
          ],
        })
      )

    })

  })

  describe('file resolution order: cwd vs rootDir', () => {

    it('should prioritize files in cwd over rootDir', () => {

      mockExistsSync.mockReturnValue(true)

      loadEnv({
        mode: 'development',
        cwd: '/monorepo/packages/app',
        rootDir: '/monorepo',
      })

      withConfigPath((config) => {

        const pathList = ensureArray(config.path).map(String)

        // Все файлы из cwd должны быть раньше файлов из rootDir
        const cwdPaths = pathList.filter(p => p.startsWith('/monorepo/packages/app'))
        const rootPaths = pathList.filter(p => p.startsWith('/monorepo/') && !p.startsWith('/monorepo/packages/app'))

        expect(cwdPaths.length).toBeGreaterThan(0)
        expect(rootPaths.length).toBeGreaterThan(0)

        const lastCwdIndex = pathList.lastIndexOf(cwdPaths[cwdPaths.length - 1])
        const firstRootIndex = pathList.indexOf(rootPaths[0])

        expect(lastCwdIndex).toBeLessThan(firstRootIndex)

      })

    })

    it('should not resolve files in rootDir when not provided', () => {

      mockExistsSync.mockReturnValue(true)

      loadEnv({ mode: 'development', cwd: '/app' })

      withConfigPath((config) => {

        const paths = ensureArray(config.path).map(String)

        expect(paths.every(p => p.startsWith('/app'))).toBe(true)

      })

    })

    it('should avoid duplicate file entries when cwd equals rootDir', () => {

      mockExistsSync.mockReturnValue(true)

      loadEnv({
        mode: 'development',
        cwd: '/app',
        rootDir: '/app',
      })

      withConfigPath((config) => {

        const paths = ensureArray(config.path).map(String)

        // Должно быть ровно 4 файла для development (без дубликатов)
        expect(paths).toHaveLength(4)

      })

    })

    it('should only include existing .env files in result', () => {

      mockExistsSync.mockImplementation((path) => {

        return path === '/app/.env' || path === '/app/.env.development'

      })

      loadEnv({ mode: 'development', cwd: '/app' })

      withConfigPath((config) => {

        const paths = ensureArray(config.path).map(String)

        expect(paths).toEqual([
          '/app/.env.development',
          '/app/.env',
        ])

      })

    })

  })

  describe('NODE_ENV handling and keepNodeEnv', () => {

    beforeEach(() => {

      mockExistsSync.mockReturnValue(true)
      process.env.NODE_ENV = 'production'

    })

    it('should include NODE_ENV by default', () => {

      mockDotenvxConfigWithEnv({
        MIRTA_TEST: 'value',
      })

      const env = loadEnv()

      expect(env).toHaveProperty('NODE_ENV', 'production')

    })

    it('should exclude NODE_ENV when keepNodeEnv is false', () => {

      mockDotenvxConfigWithEnv({
        MIRTA_TEST: 'value',
      })

      const env = loadEnv({ keepNodeEnv: false })

      expect(env).not.toHaveProperty('NODE_ENV')
      expect(env).toHaveProperty('MIRTA_TEST')

    })

    it('should preserve NODE_ENV even when not matching prefix, if keepNodeEnv: true', () => {

      mockDotenvxConfigWithEnv({
        CUSTOM_VAR: 'value',
      })

      const env = loadEnv({ prefix: 'CUSTOM_', keepNodeEnv: true })

      expect(env).toHaveProperty('NODE_ENV', 'production')
      expect(env).toHaveProperty('CUSTOM_VAR', 'value')

    })

  })

  describe('custom envFile configuration', () => {

    beforeEach(() => {

      mockExistsSync.mockReturnValue(true)

    })

    it('should resolve custom envFile name (e.g. .env.custom)', () => {

      delete process.env.NODE_ENV

      loadEnv({ envFile: '.env.custom', cwd: '/app' })

      expect(mockDotenvxConfig).toHaveBeenCalledWith(
        expect.objectContaining({
          path: ['/app/.env.custom'],
        })
      )

    })

    it('should resolve mixed envFile entries (e.g. .env and .env.custom', () => {

      loadEnv({ envFile: ['.env', '.env.custom'], cwd: '/app' })

      withConfigPath((config) => {

        const paths = ensureArray(config.path).map(String)

        expect(paths).toContain('/app/.env')
        expect(paths).toContain('/app/.env.custom')

      })

    })

    it('should deduplicate envFile array entries', () => {

      loadEnv({ envFile: ['.env', '.env', '.env'], cwd: '/app' })

      withConfigPath((config) => {

        const envPaths = ensureArray(config.path)
          .filter(p => p === '/app/.env')

        expect(envPaths).toHaveLength(1)

      })

    })

  })

  describe('duplicate file handling', () => {

    beforeEach(() => {

      vi.clearAllMocks()
      mockExistsSync.mockReturnValue(true)

    })

    it('should warn when envFile entries produce duplicate resolved files', () => {

      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {
        //
      })

      loadEnv({
        mode: 'development',
        cwd: '/app',
        envFile: ['.env', '.env.local'],
      })

      expect(warn).toHaveBeenCalledWith(
        expect.stringContaining('Redundant env file entry detected')
      )

      warn.mockRestore()

    })

    it('should sort envFile entries by length to prevent premature duplicate detection', () => {

      loadEnv({
        mode: 'development',
        cwd: '/app',
        envFile: ['.env.custom', '.env'],
      })

      withConfigPath((config) => {

        const paths = ensureArray(config.path).map(String)

        // Находим точные пути
        const devLocal = paths.find(p => p === '/app/.env.development.local')
        const dev = paths.find(p => p === '/app/.env.development')

        expect(devLocal).toBeDefined()
        expect(dev).toBeDefined()

        if (!devLocal || !dev)
          return

        expect(paths.indexOf(devLocal))
          .toBeLessThan(paths.indexOf(dev))

      })

    })

  })

  describe('dotenvx integration', () => {

    beforeEach(() => {

      mockExistsSync.mockReturnValue(true)

    })

    it('should forward user-provided dotenv options to dotenvx.config', () => {

      loadEnv({
        cwd: '/app',
        dotenv: {
          encoding: 'utf16',
          debug: true,
          strict: true,
        },
      })

      expect(mockDotenvxConfig).toHaveBeenCalledWith(
        expect.objectContaining({
          encoding: 'utf16',
          debug: true,
          strict: true,
        })
      )

    })

    it('should set default logLevel to "warn" unless overridden', () => {

      loadEnv({ cwd: '/app' })

      expect(mockDotenvxConfig).toHaveBeenCalledWith(
        expect.objectContaining({
          logLevel: 'warn',
        })
      )

    })

    it('should suppress MISSING_ENV_FILE errors by default', () => {

      loadEnv({ cwd: '/app' })

      expect(mockDotenvxConfig).toHaveBeenCalledWith(
        expect.objectContaining({
          ignore: ['MISSING_ENV_FILE'],
        })
      )

    })

    it('should use isolated processEnv to avoid mutating global process.env', () => {

      loadEnv({ cwd: '/app' })

      withConfigPath((config) => {

        expect(config.processEnv).toBeDefined()
        expect(config.processEnv).not.toBe(process.env)

      })

    })

    it('should disable dotenvx convention mode', () => {

      loadEnv({ cwd: '/app' })

      expect(mockDotenvxConfig).toHaveBeenCalledWith(
        expect.objectContaining({
          convention: undefined,
        })
      )

    })

  })

  describe('environment variable sorting', () => {

    beforeEach(() => {

      mockExistsSync.mockReturnValue(true)

    })

    it('should sort filtered env keys in lexicographical order', () => {

      mockDotenvxConfigWithEnv({
        MIRTA_Z: 'z',
        APP_A: 'a',
        MIRTA_A: 'a',
        APP_Z: 'z',
      })

      const env = loadEnv({ keepNodeEnv: false })
      const keys = Object.keys(env)

      expect(keys).toEqual([
        'APP_A',
        'APP_Z',
        'MIRTA_A',
        'MIRTA_Z',
      ])

    })

    it('should sort numeric string keys naturally (e.g. VAR1, VAR2, VAR10)', () => {

      mockDotenvxConfigWithEnv({
        MIRTA_VAR10: '10',
        MIRTA_VAR2: '2',
        MIRTA_VAR1: '1',
      })

      const env = loadEnv({ keepNodeEnv: false })
      const keys = Object.keys(env)

      expect(keys).toEqual([
        'MIRTA_VAR1',
        'MIRTA_VAR2',
        'MIRTA_VAR10',
      ])

    })

  })

})
