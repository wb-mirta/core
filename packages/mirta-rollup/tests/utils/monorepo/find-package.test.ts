const {
  findPackageByChunkName,
} = await import('#utils/monorepo/find-package');

describe('findPackageByChunkName', () => {

  const mockContext = {
    rootDir: '/monorepo',
    manager: 'pnpm' as const,
    packages: [
      { name: '@scope/nested-lib', workspacePath: 'packages/nested/lib' },
      { name: '@scope/app', workspacePath: 'packages/app' },
      { name: '@scope/lib', workspacePath: 'packages/lib' },
    ],
  };

  it('should find package by chunk name prefix', () => {

    const result = findPackageByChunkName(
      mockContext,
      'packages/app/src/index.ts'
    );

    expect(result).toEqual({ name: '@scope/app', workspacePath: 'packages/app' });

  });

  it('should match longest path first due to array order', () => {

    const result = findPackageByChunkName(
      mockContext,
      'packages/nested/lib/src/utils.ts'
    );

    expect(result?.name).toBe('@scope/nested-lib');
    expect(result?.workspacePath).toBe('packages/nested/lib');

  });

  it('should return undefined when no match found', () => {

    const result = findPackageByChunkName(
      mockContext,
      'other/path/file.ts'
    );

    expect(result).toBeUndefined();

  });

  it('should require trailing slash after workspace path', () => {

    const result = findPackageByChunkName(
      mockContext,
      'packages/appium/src/test.ts'
    );

    // Should NOT match packages/app because appium has more chars
    expect(result).toBeUndefined();

  });

  it('should work with exact workspace path plus file', () => {

    const result = findPackageByChunkName(
      mockContext,
      'packages/lib/index.ts'
    );

    expect(result?.name).toBe('@scope/lib');

  });

});
