vi.mock('#src/i18n', () => ({
  t: vi.fn((key: string) => key),
  getLocale: vi.fn(() => 'en-US'),
  setLocaleAsync: vi.fn(),
}));

vi.mock('#utils/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    success: vi.fn(),
    cancel: vi.fn(),
    step: vi.fn(),
    note: vi.fn(),
    log: vi.fn(),
    setLevel: vi.fn(),
  },
}));

const {
  getConnectionTarget,
} = await import('#src/config/connection');

describe('getConnectionTarget', () => {

  it('should format connection without port when using default SSH port', () => {

    const connection = {
      type: 'ssh',
      hostname: '192.168.1.10',
      username: 'root',
      port: 22,
    };

    expect(getConnectionTarget(connection)).toBe('root@192.168.1.10');

  });

  it('should include port in target when using non-standard port', () => {

    const connection = {
      type: 'ssh',
      hostname: '192.168.1.10',
      username: 'admin',
      port: 2222,
    };

    expect(getConnectionTarget(connection)).toBe('admin@192.168.1.10:2222');

  });

  it('should format connection without port when port is undefined', () => {

    const connection = {
      type: 'ssh',
      hostname: 'example.com',
      username: 'deploy',
    };

    expect(getConnectionTarget(connection)).toBe('deploy@example.com');

  });

});
