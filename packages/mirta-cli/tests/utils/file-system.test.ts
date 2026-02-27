vi.mock('node:fs/promises', () => ({
  access: vi.fn(),
}));

vi.mock('node:os', () => ({
  homedir: vi.fn(() => '/mocked/home'),
}));

vi.mock('@mirta/package', async (importOriginal) => {

  const actual = await importOriginal<typeof import('@mirta/package')>();
  return {
    toPosix: actual.toPosix,
  };

});

vi.mock('#src/errors/source-error', () => ({
  SourceError: {
    get: vi.fn((code: string, path: string) => new Error(`${code}: ${path}`)),
  },
}));

const fsPromises = await import('node:fs/promises');
const mockAccess = vi.mocked(fsPromises.access);

const { isExistsAsync, resolveSubpath, expandHomeDir } = await import('#src/utils/file-system');

describe('isExistsAsync', () => {

  beforeEach(() => {

    mockAccess.mockClear();

  });

  it('should return true when path exists', async () => {

    mockAccess.mockResolvedValue(undefined);

    const result = await isExistsAsync('/existing/path');

    expect(result).toBe(true);
    expect(mockAccess).toHaveBeenCalledWith('/existing/path');

  });

  it('should return false when path does not exist', async () => {

    mockAccess.mockRejectedValue(
      Object.assign(new Error('ENOENT'), { code: 'ENOENT' })
    );

    const result = await isExistsAsync('/non/existing/path');

    expect(result).toBe(false);

  });

  it('should throw on access denied', async () => {

    mockAccess.mockRejectedValue(
      Object.assign(new Error('EACCES'), { code: 'EACCES' })
    );

    await expect(isExistsAsync('/forbidden/path'))
      .rejects.toThrow('EACCES');

  });

});

describe('resolveSubpath', () => {

  it('should resolve relative path within root directory', () => {

    const result = resolveSubpath('/project', 'src/components');

    expect(result).toBe('src/components');

  });

  it('should resolve absolute target path within root', () => {

    const result = resolveSubpath('/project', '/project/src/utils');

    expect(result).toBe('src/utils');

  });

  it('should throw when path escapes root with ../', () => {

    expect(() => resolveSubpath('/project/app', '../../../etc/passwd')).toThrow('path.outsideRoot');

  });

  it('should throw when path contains ../ in the middle', () => {

    expect(() => resolveSubpath('/project', 'src/../../outside')).toThrow('path.outsideRoot');

  });

  it('should allow path that looks like escape but stays within root', () => {

    const result = resolveSubpath('/project', 'src/../lib');

    expect(result).toBe('lib');

  });

  it('should return empty string for root itself', () => {

    const result = resolveSubpath('/project', '/project');

    expect(result).toBe('');

  });

  it('should handle current directory reference', () => {

    const result = resolveSubpath('/project', './src/utils');

    expect(result).toBe('src/utils');

  });

  it('should convert backslashes to forward slashes (Windows)', () => {

    const result = resolveSubpath('/project', 'src\\components\\Button');

    expect(result).toBe('src/components/Button');

  });

});

describe('expandHomeDir', () => {

  const originalPlatform = process.platform;

  afterEach(() => {

    Object.defineProperty(process, 'platform', {
      value: originalPlatform,
    });

  });

  it('should expand ~ to home directory on Unix', () => {

    Object.defineProperty(process, 'platform', { value: 'linux' });

    const result = expandHomeDir('~/.ssh/id_rsa');

    expect(result).toBe('/mocked/home/.ssh/id_rsa');
    expect(result).not.toContain('~');

  });

  it('should expand ~ to home directory on macOS', () => {

    Object.defineProperty(process, 'platform', { value: 'darwin' });

    const result = expandHomeDir('~/.ssh/config');

    expect(result).toBe('/mocked/home/.ssh/config');
    expect(result).not.toContain('~');

  });

  it('should not expand ~ on Windows', () => {

    Object.defineProperty(process, 'platform', { value: 'win32' });

    const result = expandHomeDir('~/.ssh/id_rsa');

    expect(result).toBe('~/.ssh/id_rsa');

  });

  it('should return path unchanged when not starting with ~', () => {

    const result = expandHomeDir('/absolute/path/file.txt');

    expect(result).toBe('/absolute/path/file.txt');

  });

  it('should handle ~ only (home directory itself)', () => {

    Object.defineProperty(process, 'platform', { value: 'linux' });

    const result = expandHomeDir('~');

    expect(result).not.toBe('~');
    expect(result).toBe('/mocked/home');

  });

  it('should not expand ~user syntax (different user home)', () => {

    Object.defineProperty(process, 'platform', { value: 'linux' });

    const result = expandHomeDir('~otheruser/documents');

    expect(result).toBe('~otheruser/documents');

  });

});
