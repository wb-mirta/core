import { THIS_PACKAGE_NAME } from '#src/constants';
import type { MonorepoContext } from '@mirta/workspace';
import type { GlobOptions } from 'node:fs';
import { resolve } from 'node:path';
import type { Mock } from 'vitest';

vi.mock('#utils/shell', () => ({
  runCommandAsync: vi.fn(),
}));

vi.mock('@mirta/workspace', () => ({
  resolveMonorepoContextAsync: vi.fn(),
}));

vi.mock('@mirta/package', async (importOriginal) => {

  const actual = await importOriginal<typeof import('@mirta/package')>();
  return {
    toPosix: actual.toPosix,
    readPackageAsync: vi.fn(),
    readPackage: vi.fn(),
    resolvePackagePath: vi.fn(),
    PackageError: actual.PackageError,
    parsePackageJson: actual.parsePackageJson,
  };

});

vi.mock('node:fs', () => ({
  existsSync: vi.fn(),
  readFileSync: vi.fn(),
}));

vi.mock('node:fs/promises', () => ({
  glob: vi.fn(),
  writeFile: vi.fn().mockResolvedValue(undefined),
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

vi.mock('#src/i18n', () => ({
  t: vi.fn((key: string) => key),
  getLocale: vi.fn(() => 'en-US'),
  setLocaleAsync: vi.fn(),
}));

// #utils/shell
const shell = await import('#utils/shell');
const mockRunCommandAsync = vi.mocked(shell).runCommandAsync;

// @mirta/workspace
const workspace = await import('@mirta/workspace');
const mockResolveMonorepoContextAsync = vi.mocked(workspace).resolveMonorepoContextAsync;

// @mirta/package
const pkg = await import('@mirta/package');
const mockReadPackageAsync = vi.mocked(pkg).readPackageAsync;
const mockResolvePackagePath = vi.mocked(pkg).resolvePackagePath;
const parsePackageJson = pkg.parsePackageJson;
const PackageError = pkg.PackageError;

// node:fs
const fs = await import('node:fs');
const mockExistsSync = vi.mocked(fs).existsSync;

// node:fs/promises
const fsPromises = await import('node:fs/promises');
const mockGlob = vi.mocked(fsPromises).glob;
const mockWriteFile = vi.mocked(fsPromises).writeFile;

function mockGlobReturns(...paths: string[]) {

  mockGlob.mockImplementation(
    (_patterns: string | readonly string[], _options?: GlobOptions) =>
      ({
        [Symbol.asyncIterator]() {

          return this;

        },
        [Symbol.asyncDispose]() {

          return Promise.resolve();

        },
        // eslint-disable-next-line @typescript-eslint/require-await
        async next() {

          const value = paths.shift();

          if (value === undefined)
            return { done: true, value: undefined };

          return { done: false, value };

        },
      })
  );

}

describe('package utils', () => {

  const mockRootDir = '/mock/root';

  const mockContext: MonorepoContext = {
    manager: 'pnpm',
    rootDir: mockRootDir,
    packages: [
      {
        name: '@test/package-a',
        workspacePath: 'packages/package-a',
        version: '1.0.0',
        isPrivate: false,
      },
      {
        name: '@test/package-b',
        workspacePath: 'packages/package-b',
        version: '1.0.0',
        isPrivate: true,
      },
      {
        name: '@test/package-no-version',
        workspacePath: 'packages/package-no-version',
        version: undefined,
        isPrivate: false,
      },
    ],
  };

  const mockRootPackage = {
    name: '@test/root',
    version: '1.0.0',
    scripts: {
      build: 'rollup -c',
      test: 'vitest',
    },
  };

  let cwdSpy: Mock<() => string> | undefined;

  const setupMocks = (overrides: { rootPackage?: Partial<typeof mockRootPackage> } = {}) => {

    cwdSpy = vi.spyOn(process, 'cwd').mockReturnValue(mockRootDir);

    mockResolveMonorepoContextAsync.mockResolvedValue(mockContext);

    mockReadPackageAsync.mockResolvedValue({ ...mockRootPackage, ...overrides.rootPackage });

    mockResolvePackagePath.mockImplementation((dir: string) => resolve(dir, 'package.json'));

    mockGlob.mockImplementation(
      () =>
        ({
          [Symbol.asyncIterator]() {

            return this;

          },
          [Symbol.asyncDispose]() {

            return Promise.resolve();

          },
          // eslint-disable-next-line @typescript-eslint/require-await
          async next() {

            return { done: true, value: undefined };

          },
        })
    );

  };

  const importModule = async () => {

    vi.resetModules();
    return await import('#utils/package');

  };

  beforeEach(() => {

    vi.clearAllMocks();
    setupMocks();

  });

  afterEach(() => {

    cwdSpy?.mockRestore();
    cwdSpy = undefined;

  });

  describe('getCurrentVersion', () => {

    it('should return version from root package', async () => {

      const { getCurrentVersion } = await importModule();
      expect(getCurrentVersion()).toBe('1.0.0');

    });

    it('should throw if root package has no version', async () => {

      mockReadPackageAsync.mockResolvedValue({ name: '@test/root' });
      const { getCurrentVersion } = await importModule();
      expect(() => getCurrentVersion()).toThrow(
        PackageError.getScoped(THIS_PACKAGE_NAME, 'noVersionField')
      );

    });

  });

  describe('hasScript', () => {

    it('should return true for existing script', async () => {

      const { hasScript } = await importModule();
      expect(hasScript('build')).toBe(true);
      expect(hasScript('test')).toBe(true);

    });

    it('should return false for missing script', async () => {

      const { hasScript } = await importModule();
      expect(hasScript('nonexistent')).toBe(false);

    });

    it('should return false if scripts field is missing', async () => {

      mockReadPackageAsync.mockResolvedValue({ name: '@test/root', version: '1.0.0' });
      const { hasScript } = await importModule();
      expect(hasScript('build')).toBe(false);

    });

  });

  describe('updateVersion', () => {

    beforeEach(() => {

      mockReadPackageAsync
        // eslint-disable-next-line @typescript-eslint/require-await
        .mockImplementation(async (dir: string) => {

          if (dir === '/mock/root')
            return { ...mockRootPackage };

          if (dir.includes('package-a'))
            return { name: '@test/package-a', version: '1.0.0' };

          if (dir.includes('package-b'))
            return { name: '@test/package-b', version: '1.0.0' };

          return { name: 'unknown', version: '1.0.0' };

        });

    });

    it('should update version in root and versioned packages', async () => {

      mockExistsSync.mockReturnValue(true);
      mockGlobReturns('/mock/root/templates/a/package.json');

      const { updateVersion } = await importModule();

      await updateVersion('2.0.0', {
        project: {
          templates: ['templates'],
        },
      });

      expect(mockWriteFile).toHaveBeenCalledTimes(4); // root + 2 пакета + 1 шаблон

    });

    it('should update dependencies in template packages', async () => {

      mockExistsSync.mockReturnValue(true);
      mockGlobReturns('/mock/root/templates/a/package.json');

      mockReadPackageAsync.mockResolvedValue({
        name: 'template-package',
        dependencies: { '@test/package-a': '1.0.0' },
        devDependencies: { '@test/package-a': '1.0.0' },
      });

      const { updateVersion } = await importModule();

      await updateVersion('2.0.0', {
        project: {
          templates: ['templates'],
        },
      });

      const call = mockWriteFile.mock.calls
        .find(([p]) => typeof p === 'string' && p.includes('templates'));

      expect(call).toBeDefined();

      if (!call)
        return;

      const content = call[1] as string;
      const pkg = parsePackageJson(content);

      expect(pkg.dependencies?.['@test/package-a']).toBe('2.0.0');
      expect(pkg.devDependencies?.['@test/package-a']).toBe('2.0.0');

    });

  });

  // --- buildPackagesAsync ---
  describe('buildPackagesAsync', () => {

    it('should run build command when skipBuild is false', async () => {

      const { buildPackagesAsync } = await importModule();
      await buildPackagesAsync(false);
      expect(mockRunCommandAsync).toHaveBeenCalledWith('pnpm', ['run', 'build']);

    });

    it('should skip build when skipBuild is true', async () => {

      const { buildPackagesAsync } = await importModule();
      await buildPackagesAsync(true);
      expect(mockRunCommandAsync).not.toHaveBeenCalled();

    });

  });

  describe('publishPackagesAsync', () => {

    beforeEach(() => {

      mockRunCommandAsync.mockResolvedValue({
        stdout: '',
        stderr: '',
        isDone: true,
        code: 0,
      });

    });

    it('should publish only public packages', async () => {

      const utils = await importModule();

      const spyCheck = vi.spyOn(utils, 'checkPackageExistsAsync')
        .mockResolvedValue(true);

      await utils.publishPackagesAsync('1.0.0', false, false);

      const publishCalls = mockRunCommandAsync.mock.calls.filter(
        ([cmd, args]) => cmd === 'pnpm' && args?.[0] === 'publish'
      );

      expect(publishCalls.length).toBe(1);

      spyCheck.mockRestore();

    });

    it('should include --dry-run flag in dry run mode', async () => {

      const { publishPackagesAsync } = await importModule();
      await publishPackagesAsync('1.0.0', false, true);
      expect(mockRunCommandAsync).toHaveBeenCalledWith(
        'pnpm',
        expect.arrayContaining(['--dry-run', '--no-git-checks']),
        expect.objectContaining({
          cwd: expect.any(String) as unknown,
          stdio: 'pipe',
        })
      );

    });

    it('should use correct tag for alpha versions', async () => {

      const { publishPackagesAsync } = await importModule();
      await publishPackagesAsync('1.0.0-alpha.0', false, false);
      expect(mockRunCommandAsync).toHaveBeenCalledWith(
        'pnpm',
        expect.arrayContaining(['--tag', 'alpha']),
        expect.objectContaining({
          cwd: expect.any(String) as unknown,
          stdio: 'pipe',
        })
      );

    });

  });

});
