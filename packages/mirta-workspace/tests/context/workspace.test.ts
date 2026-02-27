import { findUp } from 'find-up';
import { WorkspaceError } from '#errors';
import { toPosix } from '@mirta/package';

vi.mock('find-up', () => ({
  findUp: vi.fn(),
}));

vi.mock('@mirta/package', async () => {

  const actual = await vi.importActual<typeof import('@mirta/package')>('@mirta/package');

  return {
    ...actual,
    readPackageAsync: vi.fn(),
  };

});

const mockFindUp = vi.mocked(findUp);
const { readPackageAsync } = await import('@mirta/package');
const mockReadPackageAsync = vi.mocked(readPackageAsync);

const { resolveWorkspaceContextAsync } = await import('#context/workspace');

describe('workspace utilities', () => {

  beforeEach(() => {

    vi.clearAllMocks();

  });

  describe('resolveWorkspaceContextAsync', () => {

    describe('package manager detection', () => {

      it('should detect pnpm workspace from lockfile', async () => {

        const workspaceRoot = '/home/user/monorepo';
        mockFindUp.mockResolvedValue(`${workspaceRoot}/pnpm-lock.yaml`);
        mockReadPackageAsync.mockResolvedValue({
          name: 'root',
          workspaces: ['packages/*'],
        });

        const result = await resolveWorkspaceContextAsync(`${workspaceRoot}/packages/app`);

        expect(result).toEqual({
          rootDir: workspaceRoot,
          manager: 'pnpm',
          workspaces: ['packages/*'],
        });
        expect(mockReadPackageAsync).toHaveBeenCalledWith(`${workspaceRoot}/package.json`);

      });

      it('should detect yarn workspace from lockfile', async () => {

        const workspaceRoot = '/home/user/monorepo';
        mockFindUp.mockResolvedValue(`${workspaceRoot}/yarn.lock`);
        mockReadPackageAsync.mockResolvedValue({
          name: 'root',
          workspaces: ['apps/*', 'libs/*'],
        });

        const result = await resolveWorkspaceContextAsync(workspaceRoot);

        expect(result.manager).toBe('yarn');
        expect(result.workspaces).toEqual(['apps/*', 'libs/*']);

      });

      it('should detect npm workspace from lockfile', async () => {

        const workspaceRoot = '/projects/app';
        mockFindUp.mockResolvedValue(`${workspaceRoot}/package-lock.json`);
        mockReadPackageAsync.mockResolvedValue({
          name: 'app',
          workspaces: ['modules/*'],
        });

        const result = await resolveWorkspaceContextAsync(workspaceRoot);

        expect(result.manager).toBe('npm');
        expect(result.rootDir).toBe(workspaceRoot);

      });

      it('should detect bun workspace from lockfile', async () => {

        const workspaceRoot = '/dev/project';
        mockFindUp.mockResolvedValue(`${workspaceRoot}/bun.lock`);
        mockReadPackageAsync.mockResolvedValue({
          name: 'project',
          workspaces: ['src/*'],
        });

        const result = await resolveWorkspaceContextAsync(workspaceRoot);

        expect(result.manager).toBe('bun');

      });

    });

    describe('workspaces field handling', () => {

      it('should handle missing workspaces field gracefully', async () => {

        const workspaceRoot = '/standalone';
        mockFindUp.mockResolvedValue(`${workspaceRoot}/pnpm-lock.yaml`);
        mockReadPackageAsync.mockResolvedValue({ name: 'standalone' });

        const result = await resolveWorkspaceContextAsync(workspaceRoot);

        expect(result.manager).toBe('pnpm');
        expect(result.workspaces).toBeUndefined();

      });

      it('should handle multiple workspace patterns', async () => {

        const workspaceRoot = '/complex';
        mockFindUp.mockResolvedValue(`${workspaceRoot}/pnpm-lock.yaml`);
        mockReadPackageAsync.mockResolvedValue({
          name: 'complex',
          workspaces: ['packages/*', 'apps/*', 'tools/*'],
        });

        const result = await resolveWorkspaceContextAsync(workspaceRoot);

        expect(result.workspaces).toHaveLength(3);
        expect(result.workspaces).toContain('packages/*');
        expect(result.workspaces).toContain('apps/*');
        expect(result.workspaces).toContain('tools/*');

      });

      it('should handle empty workspaces array', async () => {

        const workspaceRoot = '/empty';
        mockFindUp.mockResolvedValue(`${workspaceRoot}/pnpm-lock.yaml`);
        mockReadPackageAsync.mockResolvedValue({
          name: 'empty',
          workspaces: [],
        });

        const result = await resolveWorkspaceContextAsync(workspaceRoot);

        expect(result.workspaces).toEqual([]);

      });

    });

    describe('error handling', () => {

      it('should throw error when no lockfile is found', async () => {

        mockFindUp.mockResolvedValue(undefined);

        await expect(resolveWorkspaceContextAsync('/some/path'))
          .rejects
          .toThrow(WorkspaceError.get('noLockfile'));

      });

      it('should throw error for invalid workspaces format (object)', async () => {

        const workspaceRoot = '/bad/config';
        mockFindUp.mockResolvedValue(`${workspaceRoot}/yarn.lock`);
        mockReadPackageAsync.mockResolvedValue({
          name: 'bad',
          workspaces: { packages: ['apps/*'] } as unknown as string[],
        });

        await expect(resolveWorkspaceContextAsync(workspaceRoot))
          .rejects
          .toThrow(WorkspaceError.get('invalidWorkspaces', `${workspaceRoot}/package.json`));

      });

      it('should throw error for workspaces array with non-string values', async () => {

        const workspaceRoot = '/bad/config';
        mockFindUp.mockResolvedValue(`${workspaceRoot}/pnpm-lock.yaml`);
        mockReadPackageAsync.mockResolvedValue({
          name: 'bad',
          workspaces: ['valid', 123, null] as unknown as string[],
        });

        await expect(resolveWorkspaceContextAsync(workspaceRoot))
          .rejects
          .toThrow(WorkspaceError.get('invalidWorkspaces', `${workspaceRoot}/package.json`));

      });

      it('should throw error for workspaces array with mixed types', async () => {

        const workspaceRoot = '/mixed';
        mockFindUp.mockResolvedValue(`${workspaceRoot}/pnpm-lock.yaml`);
        mockReadPackageAsync.mockResolvedValue({
          name: 'mixed',
          workspaces: ['packages/*', false, undefined] as unknown as string[],
        });

        await expect(resolveWorkspaceContextAsync(workspaceRoot))
          .rejects
          .toThrow(WorkspaceError.get('invalidWorkspaces', `${workspaceRoot}/package.json`));

      });

    });

    describe('path normalization', () => {

      it('should normalize Windows paths to POSIX format', async () => {

        const workspaceRoot = 'C:\\Users\\repos\\project';
        mockFindUp.mockResolvedValue(`${workspaceRoot}\\pnpm-lock.yaml`);
        mockReadPackageAsync.mockResolvedValue({
          name: 'win-project',
          workspaces: ['packages/*'],
        });

        const result = await resolveWorkspaceContextAsync(workspaceRoot);

        expect(result.rootDir).toBe(toPosix(workspaceRoot));
        expect(result.manager).toBe('pnpm');

      });

      it('should handle mixed path separators', async () => {

        const workspaceRoot = 'D:/dev\\projects\\app';
        mockFindUp.mockResolvedValue(`${workspaceRoot}/yarn.lock`);
        mockReadPackageAsync.mockResolvedValue({
          name: 'mixed-paths',
          workspaces: ['libs/*'],
        });

        const result = await resolveWorkspaceContextAsync(workspaceRoot);

        expect(result.rootDir).toBe(toPosix(workspaceRoot));

      });

    });

    describe('real-world scenarios', () => {

      it('should resolve context from deeply nested package', async () => {

        const workspaceRoot = '/home/user/mono';
        mockFindUp.mockResolvedValue(`${workspaceRoot}/pnpm-lock.yaml`);
        mockReadPackageAsync.mockResolvedValue({
          name: 'mono',
          workspaces: ['packages/*'],
        });

        const result = await resolveWorkspaceContextAsync(
          `${workspaceRoot}/packages/nested/deep/pkg`
        );

        expect(result.rootDir).toBe(workspaceRoot);

      });

      it('should handle workspace root as current directory', async () => {

        const workspaceRoot = '/workspace';
        mockFindUp.mockResolvedValue(`${workspaceRoot}/bun.lock`);
        mockReadPackageAsync.mockResolvedValue({
          name: 'current',
          workspaces: ['src/*'],
        });

        const result = await resolveWorkspaceContextAsync(workspaceRoot);

        expect(result.rootDir).toBe(workspaceRoot);

      });

    });

  });

});
