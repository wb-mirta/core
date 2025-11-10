import type { DotenvConfigOptions } from '@dotenvx/dotenvx'

vi.mock('node:fs', () => ({
  existsSync: vi.fn(),
}))

vi.mock('@dotenvx/dotenvx', () => ({
  default: {
    config: vi.fn(),
  },
}))

const existsSync = (await import('node:fs')).existsSync
export const mockExistsSync = vi.mocked(existsSync)

const dotenvx = await import('@dotenvx/dotenvx')
export const mockDotenvxConfig = vi.mocked(dotenvx.default.config)

/**
 * Устанавливает мок для `dotenvx.config`, который наполняет `processEnv`
 */
export function mockConfigWithEnv(env: Record<string, string> = {}) {

  mockDotenvxConfig.mockImplementation((config) => {

    if (!config || !('processEnv' in config)) {

      throw new Error(
        '[Test Setup] dotenvx.config was called without "processEnv". '
        + 'Check if loadEnv passes { processEnv } to dotenvx.config().'
      )

    }

    if (config.processEnv == null) {

      throw new Error(
        '[Test Setup] dotenvx.config received processEnv: undefined or null. '
        + 'It must be an object.'
      )

    }

    Object.assign(config.processEnv, env)
    return {}

  })

}

/**
 * Утилита для проверки последнего вызова `dotenvx.config`
 */
export function expectConfigCalledWith(
  matcher: (config: DotenvConfigOptions) => void
) {

  const lastCall = mockDotenvxConfig.mock.lastCall

  expect(lastCall).toBeDefined()

  if (!lastCall)
    return

  const [config] = lastCall

  expect(config).toBeDefined()

  if (!config)
    return

  matcher(config)

}

// --- Глобальные утилиты для тестов ---

const originalEnv = process.env
const originalCwd = process.cwd()

export function resetTestEnv() {

  vi.resetAllMocks()

  // ⚠️ БЕЗОПАСНОСТЬ: Полностью заменяем process.env на контролируемый набор
  // Это предотвращает утечку системных переменных в логи при падении тестов
  //
  process.env = {
    NODE_ENV: 'development', // только необходимый минимум.
  }

  vi.spyOn(process, 'cwd').mockReturnValue('/test/project')
  mockExistsSync.mockReturnValue(true)

}

export function restoreTestEnv() {

  process.env = originalEnv

  vi.spyOn(process, 'cwd').mockReturnValue(originalCwd)

}
