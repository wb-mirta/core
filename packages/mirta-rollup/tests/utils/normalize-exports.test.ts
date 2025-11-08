import type { ExportsEntry } from '@mirta/package'
import { normalizeExports } from '#configs/package'
import { NpmBuildError } from '#utils/errors'

describe('normalizeExports', () => {

  it('should handle string export', () => {

    const result = normalizeExports('./dist/index.mjs')
    expect(result).toEqual({
      './dist/index.mjs': {},
    })

  })

  it('should handle simple conditional export', () => {

    const result = normalizeExports({
      '.': {
        import: './dist/index.mjs',
      },
    })

    expect(result).toEqual({
      './dist/index.mjs': {},
    })

  })

  it('should handle conditional export with types', () => {

    const result = normalizeExports({
      '.': {
        import: {
          default: './dist/index.mjs',
          types: './dist/index.d.ts',
        },
      },
    })

    expect(result).toEqual({
      './dist/index.mjs': {
        dtsOutputFile: './dist/index.d.ts',
      },
    })

  })

  it('should handle flat exports with types', () => {

    const result = normalizeExports({
      '.': './dist/index.mjs',
      './utils': {
        types: './dist/utils.d.ts',
        default: './dist/utils.mjs',
      },
    })

    expect(result).toEqual({
      './dist/index.mjs': {},
      './dist/utils.mjs': {
        dtsOutputFile: './dist/utils.d.ts',
      },
    })

  })

  it('should throw if types defined without entry', () => {

    expect(() =>
      normalizeExports({
        '.': {
          import: { types: './dist/index.d.ts' },
        },
      })
    ).toThrow(NpmBuildError.get('exportTypesOnly', './dist/index.d.ts'))

  })

  it('should throw if exports is array', () => {

    expect(() => normalizeExports([] as unknown as Record<string, ExportsEntry>))
      .toThrow(NpmBuildError.get('exportDisallowArrayType'))

  })

  it('should throw if export key does not start with dot', () => {

    expect(() =>
      normalizeExports({
        'bad-key': './dist/index.mjs',
      })
    ).toThrow(NpmBuildError.get('exportMustStartWithDot', 'bad-key'))

  })

})
