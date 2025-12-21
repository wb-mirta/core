vi.mock('#src/utils/env', () => ({
  replaceEnvVars: vi.fn((input: string) => input),
}))

vi.mock('#src/i18n', () => ({
  t: vi.fn((key: string) => key),
  getLocale: vi.fn(() => 'en-US'),
  setLocaleAsync: vi.fn(),
}))

const { replaceEnvVars } = await import('#src/utils/env')
const mockReplaceEnvVars = vi.mocked(replaceEnvVars)

const {
  parseConnectionString,
} = await import('#src/config/connection/parse')

describe('parseConnectionString', () => {

  beforeEach(() => {

    mockReplaceEnvVars.mockImplementation(input => input)

  })

  it('should parse basic SSH connection string', () => {

    const result = parseConnectionString('ssh://root@192.168.42.1')

    expect(result).toEqual({
      type: 'ssh',
      hostname: '192.168.42.1',
      username: 'root',
      port: undefined,
    })

  })

  it('should parse connection string with port', () => {

    const result = parseConnectionString('ssh://admin@example.com:2222')

    expect(result).toMatchObject({
      type: 'ssh',
      hostname: 'example.com',
      username: 'admin',
      port: '2222',
    })

  })

  it('should parse connection string with PKCS11 token', () => {

    const result = parseConnectionString('ssh://root@192.168.1.1;pkcs11=/usr/lib/librtpkcs11.so')

    expect(result).toMatchObject({
      type: 'ssh',
      hostname: '192.168.1.1',
      username: 'root',
      pkcs11: '/usr/lib/librtpkcs11.so',
    })

  })

  it('should parse connection string with SSH key', () => {

    const result = parseConnectionString('ssh://root@192.168.1.1;key=~/.ssh/id_ed25519')

    expect(result).toMatchObject({
      type: 'ssh',
      hostname: '192.168.1.1',
      username: 'root',
      key: '~/.ssh/id_ed25519',
    })

  })

  it('should parse connection string with TTL', () => {

    const result = parseConnectionString('ssh://root@192.168.1.1;key=~/.ssh/id_rsa;ttl=1h')

    expect(result).toMatchObject({
      type: 'ssh',
      hostname: '192.168.1.1',
      username: 'root',
      key: '~/.ssh/id_rsa',
      ttl: '1h',
    })

  })

  it('should parse connection string with WSL distro', () => {

    const result = parseConnectionString('ssh://root@192.168.1.1;wsl=Ubuntu')

    expect(result).toMatchObject({
      type: 'ssh',
      username: 'root',
      hostname: '192.168.1.1',
      wsl: 'Ubuntu',
    })

  })

  it('should parse connection string with multiple parameters', () => {

    const result = parseConnectionString('ssh://deploy@controller.local:2222;key=~/.ssh/id_ed25519;ttl=30m;wsl=Ubuntu-22.04')

    expect(result).toMatchObject({
      type: 'ssh',
      username: 'deploy',
      hostname: 'controller.local',
      port: '2222',
      key: '~/.ssh/id_ed25519',
      ttl: '30m',
      wsl: 'Ubuntu-22.04',
    })

  })

  it('should decode URL-encoded username', () => {

    const result = parseConnectionString('ssh://user%40domain@192.168.1.1')

    expect(result.username).toBe('user@domain')

  })

  it('should support custom protocols with + suffix', () => {

    const result = parseConnectionString('mirta+ssh://root@192.168.1.1')

    expect(result.type).toBe('mirta+ssh')

  })

  it('should throw on empty connection string', () => {

    expect(() => parseConnectionString('')).toThrow('Empty connection string')

  })

  it('should throw on invalid URL format', () => {

    expect(() => parseConnectionString('not-a-url')).toThrow('Invalid connection URL')

  })

  it('should call replaceEnvVars to substitute environment variables', () => {

    mockReplaceEnvVars.mockReturnValue('ssh://root@192.168.1.1')

    parseConnectionString('ssh://root@${HOST}')

    expect(mockReplaceEnvVars).toHaveBeenCalledWith('ssh://root@${HOST}')

  })

})
