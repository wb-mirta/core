import nodePath from 'node:path'

import { readPackage, toPosix, type PackageExports } from '@mirta/package'

// === Моки ===

vi.mock('@mirta/package', async () => {

  const actual = await vi.importActual<typeof import('@mirta/package')>('@mirta/package')

  return ({
    ...actual,
    readPackage: vi.fn(),
  })

})

vi.mock('@rollup/plugin-typescript', () => ({
  default: vi.fn().mockReturnValue({ name: 'mock-typescript' }),
}))

// === Явные мок-ссылки ===

const mockReadPackage = vi.mocked(readPackage)

// === Вспомогательные функции ===

function mockPackageExports(exports: PackageExports) {

  mockReadPackage.mockReturnValue({ exports })

}

// === Тесты ===

// Import after mocking
const { definePackageConfig } = await import('#configs/package')

describe('definePackageConfig — integration', () => {

  afterEach(() => {

    vi.restoreAllMocks()

  })

  it('should generate ESM and DTS configs when types are defined', () => {

    mockPackageExports({
      '.': {
        import: {
          default: './dist/index.mjs',
          types: './dist/index.d.ts',
        },
      },
    })

    const config = definePackageConfig({ input: 'src/index.ts' })

    expect(config).toHaveLength(2)
    expect(config[0].plugins).toContainEqual({ name: 'mock-typescript' })
    expect(config[1].input).toEqual(['dist/dts/index.d.ts'])

  })

  it('should generate only ESM config when no types', () => {

    mockPackageExports({
      '.': './dist/index.mjs',
    })

    const config = definePackageConfig({ input: 'src/index.ts' })
    expect(config).toHaveLength(1)

  })

  it('should work in bootstrap mode', () => {

    vi.spyOn(process, 'cwd').mockReturnValue('/repo')
    mockPackageExports({ '.': './dist/index.mjs' })

    const config = definePackageConfig({
      cwd: '/repo/packages/core',
      input: 'src/index.ts',
    })

    const expectedPrefix = toPosix(nodePath.relative('/repo', '/repo/packages/core')) + '/'
    expect(config[0].input).toEqual([`${expectedPrefix}src/index.ts`])

  })

})
