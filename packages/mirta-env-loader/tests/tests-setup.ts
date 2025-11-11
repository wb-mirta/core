import type { DotenvConfigOptions } from '@dotenvx/dotenvx'
import type { Mock } from 'vitest'

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
 * Устанавливает мок для `dotenvx.config`, который при вызове объединяет указанные пары ключ‑значение в переданный объект `processEnv`.
 *
 * @param env - Объект с переменными окружения (ключ → значение), которые будут скопированы в `config.processEnv`.
 * @throws Если `dotenvx.config` был вызван без аргумента или без свойства `processEnv`.
 * @throws Если `config.processEnv` равен `null` или `undefined`.
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
 * Вызывает переданный матчер с конфигурацией из последнего вызова `dotenvx.config`, если такой вызов существует.
 *
 * Если вызов не зафиксирован или аргумент конфигурации отсутствует, функция ничего не делает.
 *
 * @param matcher - Функция, которой будет передан объект конфигурации (`DotenvConfigOptions`) последнего вызова `dotenvx.config`
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

let cwdSpy: Mock<() => string> | undefined

/**
 * Инициализирует контролируемое тестовое окружение и сбрасывает все мок-объекты.
 *
 * Сбрасывает все vi-моки, заменяет process.env на минимальный набор (NODE_ENV = 'development'),
 * подменяет process.cwd() на '/test/project' и настраивает mockExistsSync так, чтобы возвращать `true`.
 */
export function resetTestEnv() {

  vi.resetAllMocks()

  // ⚠️ БЕЗОПАСНОСТЬ: Полностью заменяем process.env на контролируемый набор
  // Это предотвращает утечку системных переменных в логи при падении тестов
  //
  process.env = {
    NODE_ENV: 'development', // только необходимый минимум.
  }

  cwdSpy = vi.spyOn(process, 'cwd').mockReturnValue('/test/project')
  mockExistsSync.mockReturnValue(true)

}

/**
 * Восстанавливает сохранённое окружение тестов.
 *
 * Восстанавливает `process.env` и поведение `process.cwd()` к значениям, сохранённым при загрузке модуля.
 */
export function restoreTestEnv() {

  process.env = originalEnv

  cwdSpy?.mockRestore()
  cwdSpy = undefined

}
