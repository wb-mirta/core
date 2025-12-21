vi.mock('#src/utils/logger', () => ({
  useLogger: () => ({
    warn: vi.fn(),
  }),
}))

const {
  getConnectionTarget,
} = await import('#src/config/connection')

describe('getConnectionTarget', () => {

  it('should format connection without port when using default SSH port', () => {

    const connection = {
      type: 'ssh',
      hostname: '192.168.1.10',
      username: 'root',
      port: 22,
    }

    expect(getConnectionTarget(connection)).toBe('root@192.168.1.10')

  })

  it('should include port in target when using non-standard port', () => {

    const connection = {
      type: 'ssh',
      hostname: '192.168.1.10',
      username: 'admin',
      port: 2222,
    }

    expect(getConnectionTarget(connection)).toBe('admin@192.168.1.10:2222')

  })

  it('should format connection without port when port is undefined', () => {

    const connection = {
      type: 'ssh',
      hostname: 'example.com',
      username: 'deploy',
    }

    expect(getConnectionTarget(connection)).toBe('deploy@example.com')

  })

})
