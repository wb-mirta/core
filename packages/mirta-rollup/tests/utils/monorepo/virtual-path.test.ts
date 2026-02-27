const {
  toVirtualModulePath,
} = await import('#utils/monorepo/virtual-path');

describe('toVirtualModulePath', () => {

  it('should map chunk path to node_modules structure', () => {

    const pkgDef = { name: '@scope/app', workspacePath: 'packages/app' };
    const result = toVirtualModulePath('packages/app/src/index.ts', pkgDef);

    expect(result).toBe('node_modules/@scope/app/src/index.ts');

  });

  it('should handle nested workspace paths', () => {

    const pkgDef = { name: '@org/nested', workspacePath: 'libs/nested/module' };
    const result = toVirtualModulePath('libs/nested/module/src/main.ts', pkgDef);

    expect(result).toBe('node_modules/@org/nested/src/main.ts');

  });

  it('should handle packages without scope', () => {

    const pkgDef = { name: 'simple-package', workspacePath: 'packages/simple' };
    const result = toVirtualModulePath('packages/simple/lib/index.ts', pkgDef);

    expect(result).toBe('node_modules/simple-package/lib/index.ts');

  });

  it('should handle root-level files within workspace', () => {

    const pkgDef = { name: '@scope/root', workspacePath: 'packages/root' };
    const result = toVirtualModulePath('packages/root/index.ts', pkgDef);

    expect(result).toBe('node_modules/@scope/root/index.ts');

  });

  it('should compute relative path correctly', () => {

    const pkgDef = { name: '@test/pkg', workspacePath: 'apps/main' };
    const result = toVirtualModulePath('apps/main/lib/utils/helper.ts', pkgDef);

    expect(result).toBe('node_modules/@test/pkg/lib/utils/helper.ts');

  });

});
