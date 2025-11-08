import { createInputBindings } from '#configs/package'
import { NpmBuildError } from '#utils/errors'

const outDir = 'dist'

describe('createInputBindings', () => {

  it('should map src/index.ts to output and dts paths', () => {

    const inputs = ['src/index.ts']
    const exports = {
      [`./${outDir}/index.mjs`]: { dtsOutputFile: './dist/index.d.ts' },
    }

    const result = createInputBindings(inputs, exports, false)

    expect(result['src/index.ts']).toEqual({
      outputFile: 'index.mjs',
      dtsSourceFile: 'dist/dts/index.d.ts',
      dtsOutputFile: './dist/index.d.ts',
    })

  })

  it('should support .js input', () => {

    const inputs = ['src/cli.js']
    const exports = {
      [`./${outDir}/cli.mjs`]: {},
    }

    const result = createInputBindings(inputs, exports, false)

    expect(result['src/cli.js']).toEqual({
      outputFile: 'cli.mjs',
      dtsSourceFile: 'dist/dts/cli.d.ts',
      dtsOutputFile: undefined,
    })

  })

  it('should throw if input not in src/', () => {

    expect(() =>
      createInputBindings(['lib/index.ts'], {}, false)
    ).toThrow(NpmBuildError.get('inputPathRequiresPrefix', 'lib/index.ts', 'src/'))

  })

  it('should throw if input has no matching export', () => {

    expect(() =>
      createInputBindings(['src/missing.ts'], {}, false)
    ).toThrow(NpmBuildError.get('inputHasNoExport', 'src/missing.ts', './dist/missing.mjs'))

  })

  it('should throw if export has no matching input', () => {

    const inputs = ['src/index.ts']

    const exports = {
      [`./${outDir}/index.mjs`]: { },
      [`./${outDir}/utils.mjs`]: { },
    }

    expect(() =>
      createInputBindings(inputs, exports, false)
    ).toThrow(NpmBuildError.get('exportHasNoInput', `./${outDir}/utils.mjs`))

  })

  it('should allow skipExports to bypass export checks', () => {

    const result = createInputBindings(['src/cli.ts'], {}, true)
    expect(result['src/cli.ts']).toBeDefined()

  })

  it('should throw on duplicate output file', () => {

    const inputs = ['src/a/index.ts', 'src/a/index.js']
    const exports = {
      [`./${outDir}/a/index.mjs`]: {},
    }

    expect(() =>
      createInputBindings(inputs, exports, false)
    ).toThrow(NpmBuildError.get('inputGeneratesDuplicateOutput', 'a/index.mjs'))

  })

})
