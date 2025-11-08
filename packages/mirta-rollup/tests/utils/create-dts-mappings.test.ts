import { createDtsMappings } from '#configs/package'

describe('createDtsMappings', () => {

  it('should create correct dts source → output mapping', () => {

    const inputBindings = {
      'src/index.ts': {
        outputFile: './dist/index.mjs',
        dtsSourceFile: 'dist/dts/index.d.ts',
        dtsOutputFile: './dist/index.d.ts',
      },
      'src/utils.ts': {
        outputFile: './dist/utils.mjs',
        dtsSourceFile: 'dist/dts/utils.d.ts',
        dtsOutputFile: './dist/utils.d.ts',
      },
    }

    const result = createDtsMappings(inputBindings)

    expect(result).toEqual({
      'dist/dts/index.d.ts': 'index.d.ts',
      'dist/dts/utils.d.ts': 'utils.d.ts',
    })

  })

  it('should skip entries without dtsOutputFile', () => {

    const inputBindings = {
      'src/index.ts': {
        outputFile: './dist/index.mjs',
        dtsSourceFile: 'dist/dts/index.d.ts',
        dtsOutputFile: undefined,
      },
    }

    const result = createDtsMappings(inputBindings)
    expect(result).toEqual({})

  })

})
