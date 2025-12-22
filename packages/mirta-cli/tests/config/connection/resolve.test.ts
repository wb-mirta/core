import type { MirtaConfig } from '#src/config/types'

vi.mock('#src/i18n', () => ({
  t: vi.fn((key: string) => key),
  getLocale: vi.fn(() => 'en-US'),
  setLocaleAsync: vi.fn(),
}))

vi.mock('#src/utils/env', () => ({
  replaceEnvVars: vi.fn((input: string) => input),
}))

const { replaceEnvVars } = await import('#src/utils/env')
const mockReplaceEnvVars = vi.mocked(replaceEnvVars)

const {
  resolveConnection,
} = await import('#src/config/connection')

describe('resolveConnection', () => {

  beforeEach(() => {

    mockReplaceEnvVars.mockImplementation(input => input)

  })

  it('should resolve connection from explicit connection string', () => {

    const config = {}

    const result = resolveConnection(config, 'ssh://root@192.168.42.1')

    expect(result).toMatchObject({
      type: 'ssh',
      hostname: '192.168.42.1',
      username: 'root',
    })

  })

  it('should resolve connection from config by name', () => {

    const config = {
      connections: {
        production: 'ssh://admin@prod.example.com:2222',
      },
    }

    const result = resolveConnection(config, 'production')

    expect(result).toMatchObject({
      type: 'ssh',
      hostname: 'prod.example.com',
      port: '2222',
      username: 'admin',
    })

  })

  it('should resolve connection from config with object value', () => {

    const config = {
      connections: {
        staging: {
          type: 'ssh',
          hostname: 'staging.example.com',
          username: 'deploy',
        },
      },
    }

    const result = resolveConnection(config, 'staging')

    expect(result).toMatchObject({
      type: 'ssh',
      hostname: 'staging.example.com',
      username: 'deploy',
    })

  })

  it('should apply default username when not provided', () => {

    const config = {}

    const result = resolveConnection(config, 'ssh://192.168.1.1')

    expect(result.username).toBe('root')

  })

  it('should use "default" connection when no input provided', () => {

    const config = {
      connections: {
        default: 'ssh://root@192.168.42.1',
      },
    }

    const result = resolveConnection(config)

    expect(result).toMatchObject({
      type: 'ssh',
      hostname: '192.168.42.1',
      username: 'root',
    })

  })

  it('should throw when connection key not found in config', () => {

    const config = {
      connections: {
        staging: 'ssh://staging.example.com',
      },
    }

    expect(() => resolveConnection(config, 'production')).toThrow('Connection "production" not found')

  })

  it('should throw when config has no connections and using named reference', () => {

    const config = {}

    expect(() => resolveConnection(config, 'production')).toThrow('Connection "production" not found')

  })

  it('should validate resolved connection', () => {

    const config = {
      connections: {
        invalid: {
          type: 'ftp',
          hostname: '192.168.1.1',
        } as unknown,
      },
    } as unknown as MirtaConfig

    expect(() => resolveConnection(config, 'invalid')).toThrow('Only SSH connection type supported')

  })

})
