vi.mock('@mirta/env-loader', () => ({
  loadEnv: vi.fn(),
}))

const envLoader = await import('@mirta/env-loader')
const mockLoadEnv = vi.mocked(envLoader.loadEnv)

const { loadEnv, replaceEnvVars, __resetInternalState } = await import('#src/utils/env')

describe('loadEnv', () => {

  beforeEach(() => {

    __resetInternalState()
    mockLoadEnv.mockClear()

  })

  let originalEnv: NodeJS.ProcessEnv

  beforeEach(() => {

    originalEnv = { ...process.env }

  })

  afterEach(() => {

    process.env = originalEnv

  })

  it('should load environment variables with WB_ and MIRTA_ prefixes', () => {

    mockLoadEnv.mockReturnValue({
      WB_HOST: '192.168.1.1',
      MIRTA_TOKEN: 'secret',
    })

    loadEnv('/project/root', '/project/cwd')

    expect(mockLoadEnv).toHaveBeenCalledWith({
      cwd: '/project/cwd',
      rootDir: '/project/root',
      prefix: ['WB_', 'MIRTA_'],
    })

  })

  it('should merge loaded variables into process.env', () => {

    mockLoadEnv.mockReturnValue({
      WB_DEPLOY_HOST: '192.168.42.1',
      MIRTA_DEV: 'true',
    })

    loadEnv('/project/root')

    expect(process.env.WB_DEPLOY_HOST).toBe('192.168.42.1')
    expect(process.env.MIRTA_DEV).toBe('true')

  })

  it('should only load once (lazy initialization)', () => {

    mockLoadEnv.mockReturnValue({})

    loadEnv('/project/root')
    loadEnv('/project/root')
    loadEnv('/project/root')

    expect(mockLoadEnv).toHaveBeenCalledTimes(1)

  })

  it('should work without cwd parameter', () => {

    mockLoadEnv.mockReturnValue({})

    loadEnv('/project/root')

    expect(mockLoadEnv).toHaveBeenCalledWith({
      cwd: undefined,
      rootDir: '/project/root',
      prefix: ['WB_', 'MIRTA_'],
    })

  })

})

describe('replaceEnvVars', () => {

  beforeEach(() => {

    process.env.TEST_VAR = 'test-value'
    process.env.WB_HOST = '192.168.42.1'
    process.env.MIRTA_PORT = '2222'

  })

  afterEach(() => {

    delete process.env.TEST_VAR
    delete process.env.WB_HOST
    delete process.env.MIRTA_PORT

  })

  it('should replace single environment variable', () => {

    const result = replaceEnvVars('${TEST_VAR}')

    expect(result).toBe('test-value')

  })

  it('should replace multiple environment variables', () => {

    const result = replaceEnvVars('ssh://root@${WB_HOST}:${MIRTA_PORT}')

    expect(result).toBe('ssh://root@192.168.42.1:2222')

  })

  it('should replace the same variable multiple times', () => {

    const result = replaceEnvVars('${TEST_VAR}-${TEST_VAR}')

    expect(result).toBe('test-value-test-value')

  })

  it('should keep string unchanged when no variables present', () => {

    const result = replaceEnvVars('ssh://root@192.168.1.1')

    expect(result).toBe('ssh://root@192.168.1.1')

  })

  it('should handle empty string', () => {

    const result = replaceEnvVars('')

    expect(result).toBe('')

  })

  it('should throw when environment variable is not set', () => {

    expect(() => replaceEnvVars('${UNDEFINED_VAR}')).toThrow('Environment variable not set: UNDEFINED_VAR')

  })

  it('should replace variables in complex strings', () => {

    const result = replaceEnvVars('Connection: ${WB_HOST} (port ${MIRTA_PORT})')

    expect(result).toBe('Connection: 192.168.42.1 (port 2222)')

  })

})

describe('__resetInternalState', () => {

  it('should reset loading state when __TEST__ is true', () => {

    mockLoadEnv.mockReturnValue({})

    // First load
    loadEnv('/project')
    expect(mockLoadEnv).toHaveBeenCalledTimes(1)

    // Reset
    __resetInternalState()

    // Should load again after reset
    loadEnv('/project')
    expect(mockLoadEnv).toHaveBeenCalledTimes(2)

  })

})
