import { createStagedArgs } from '#src/staged-args'

vi.mock('#src/i18n', () => ({
  t: vi.fn((key: string) => key),
  getLocale: vi.fn(() => 'en-US'),
  setLocaleAsync: vi.fn(),
}))

describe('createStagedArgs', () => {

  describe('basic parsing', () => {

    it('should parse boolean flags', () => {

      const schema = {
        verbose: { type: 'boolean' },
        help: { type: 'boolean' },
      } as const

      const args = createStagedArgs(['--verbose', '--help'])
      const { values, positionals } = args.parseFinal(schema)

      expect(values.verbose).toBe(true)
      expect(values.help).toBe(true)
      expect(positionals).toEqual([])

    })

    it('should parse string options', () => {

      const schema = {
        config: { type: 'string' },
        port: { type: 'string' },
      } as const

      const args = createStagedArgs(['--config', 'file.json', '--port', '3000'])
      const { values, positionals } = args.parseFinal(schema)

      expect(values.config).toBe('file.json')
      expect(values.port).toBe('3000')
      expect(positionals).toEqual([])

    })

    it('should parse positional arguments', () => {

      const schema = {} as const

      const args = createStagedArgs(['command', 'arg1', 'arg2'])
      const { values, positionals } = args.parseFinal(schema)

      expect(values).toEqual({})
      expect(positionals).toEqual(['command', 'arg1', 'arg2'])

    })

  })

  describe('short options', () => {

    it('should handle short option aliases', () => {

      const schema = {
        help: { type: 'boolean', short: 'h' },
        version: { type: 'boolean', short: 'v' },
      } as const

      const args = createStagedArgs(['-h', '-v'])
      const { values, positionals } = args.parseFinal(schema)

      expect(values.help).toBe(true)
      expect(values.version).toBe(true)
      expect(positionals).toEqual([])

    })

    it('should handle short string options', () => {

      const schema = {
        config: { type: 'string', short: 'c' },
      } as const

      const args = createStagedArgs(['-c', 'file.json'])
      const { values, positionals } = args.parseFinal(schema)

      expect(values.config).toBe('file.json')
      expect(positionals).toEqual([])

    })

  })

  describe('inline values', () => {

    it('should parse inline values with equals sign', () => {

      const schema = {
        port: { type: 'string' },
      } as const

      const args = createStagedArgs(['--port=3000'])
      const { values, positionals } = args.parseFinal(schema)

      expect(values.port).toBe('3000')
      expect(positionals).toEqual([])

    })

  })

  describe('option terminator', () => {

    it('should treat arguments after -- as positionals', () => {

      const schema = {
        verbose: { type: 'boolean' },
      } as const

      const args = createStagedArgs(['--verbose', '--', '--not-an-option'])
      const { values, positionals } = args.parseFinal(schema)

      expect(values.verbose).toBe(true)
      expect(positionals).toEqual(['--not-an-option'])

    })

  })

  describe('staged parsing', () => {

    it('should parse in stages', () => {

      const globalSchema = {
        verbose: { type: 'boolean', short: 'v' },
        config: { type: 'string', short: 'c' },
      } as const

      const commandSchema = {
        force: { type: 'boolean', short: 'f' },
      } as const

      const args = createStagedArgs(['-v', '--config', 'file.json', 'build', '--force'])
      const { values: globalValues, stagedArgs } = args.parse(globalSchema)

      expect(globalValues.verbose).toBe(true)
      expect(globalValues.config).toBe('file.json')

      const { values: commandValues, positionals } = stagedArgs.parseFinal(commandSchema)

      expect(commandValues.force).toBe(true)
      expect(positionals).toEqual(['build'])

    })

    it('should maintain positionals through stages', () => {

      const globalSchema = {
        help: { type: 'boolean' },
      } as const

      const args = createStagedArgs(['command', 'arg1', '--help'])
      const { values: globalValues, stagedArgs, positionals: globalPositionals } = args.parse(globalSchema)

      expect(globalValues.help).toBe(true)
      expect(globalPositionals).toEqual(['command', 'arg1'])

      const { positionals: finalPositionals } = stagedArgs.parseFinal({})
      expect(finalPositionals).toEqual(['command', 'arg1'])

    })

  })

  describe('error handling', () => {

    it('should throw on unknown option in parseFinal', () => {

      const schema = {
        verbose: { type: 'boolean' },
      } as const

      const args = createStagedArgs(['--unknown'])

      expect(() => args.parseFinal(schema)).toThrow()

    })

    it('should suggest closest match for unknown option', () => {

      const schema = {
        verbose: { type: 'boolean' },
      } as const

      const args = createStagedArgs(['--verbos'])

      expect(() => args.parseFinal(schema)).toThrow(/args.notFound/)

    })

    it('should not throw on unknown option in parse', () => {

      const schema = {
        verbose: { type: 'boolean' },
      } as const

      const args = createStagedArgs(['--unknown', '--verbose'])

      expect(() => args.parse(schema)).not.toThrow()

    })

  })

  describe('default values', () => {

    it('should apply default value for boolean', () => {

      const schema = {
        verbose: { type: 'boolean', default: false },
      } as const

      const args = createStagedArgs([])
      const { values } = args.parseFinal(schema)

      expect(values.verbose).toBe(false)

    })

    it('should apply default value for string', () => {

      const schema = {
        config: { type: 'string', default: 'default.json' },
      } as const

      const args = createStagedArgs([])
      const { values } = args.parseFinal(schema)

      expect(values.config).toBe('default.json')

    })

    it('should override default with provided value', () => {

      const schema = {
        verbose: { type: 'boolean', default: false },
      } as const

      const args = createStagedArgs(['--verbose'])

      const { values } = args.parseFinal(schema)

      expect(values.verbose).toBe(true)

    })

  })

  describe('mixed scenarios', () => {

    it('should handle complex real-world command line', () => {

      const globalSchema = {
        help: { type: 'boolean', short: 'h' },
        version: { type: 'boolean', short: 'v' },
        locale: { type: 'string' },
      } as const

      const releaseSchema = {
        'dry-run': { type: 'boolean' },
        'preid': { type: 'string' },
        'skip-prompts': { type: 'boolean' },
      } as const

      const args = createStagedArgs([
        '--locale', 'ru-RU',
        'release',
        '--dry-run',
        '--preid', 'alpha',
        'patch',
      ])

      const { values: globalValues, stagedArgs } = args.parse(globalSchema)

      expect(globalValues.locale).toBe('ru-RU')
      expect(globalValues.help).toBeUndefined()
      expect(globalValues.version).toBeUndefined()

      const { values: releaseValues, positionals } = stagedArgs.parseFinal(releaseSchema)

      expect(releaseValues['dry-run']).toBe(true)
      expect(releaseValues.preid).toBe('alpha')
      expect(positionals).toEqual(['release', 'patch'])

    })

  })

  describe('extended coverage', () => {

    describe('short option conflicts', () => {

      it('should throw on short-key conflict', () => {

        const schema = {
          verbose: { type: 'boolean', short: 'v' },
          v: { type: 'string' },
        } as const

        const args = createStagedArgs(['-v'])
        expect(() => args.parseFinal(schema)).toThrow(/duplicate/)

      })

      it('should throw on duplicate short aliases', () => {

        const schema = {
          help: { type: 'boolean', short: 'h' },
          header: { type: 'string', short: 'h' },
        } as const

        const args = createStagedArgs(['-h'])
        expect(() => args.parseFinal(schema)).toThrow(/duplicate/)

      })

    })

    describe('short option formats', () => {

      it('should parse short string option with inline value (-cfile.json)', () => {

        const schema = {
          config: { type: 'string', short: 'c' },
        } as const

        const args = createStagedArgs(['-cfile.json'])
        const { values } = args.parseFinal(schema)

        expect(values.config).toBe('file.json')

      })

      it('should parse short boolean option after --', () => {

        const schema = {
          verbose: { type: 'boolean', short: 'v' },
        } as const

        const args = createStagedArgs(['--', '-v'])
        const { values, positionals } = args.parseFinal(schema)

        expect(values.verbose).toBeUndefined()
        expect(positionals).toEqual(['-v'])

      })

    })

    describe('string option without value', () => {

      it('should throw if string option has no value and no default', () => {

        const schema = {
          config: { type: 'string' },
        } as const

        const args = createStagedArgs(['--config'])
        expect(() => args.parseFinal(schema)).toThrow(/missing value/i)

      })

      it('should throw if specified string option has no value', () => {

        const schema = {
          config: { type: 'string', default: 'main.json' },
        } as const

        const args = createStagedArgs(['--config'])

        expect(() => args.parseFinal(schema)).toThrow()

      })

    })

    describe('default value application timing', () => {

      it('should apply default in parse stage', () => {

        const schema = {
          verbose: { type: 'boolean', default: false },
          config: { type: 'string', default: 'app.json' },
        } as const

        const args = createStagedArgs([])

        const { values } = args.parse(schema)

        expect(values.verbose).toBe(false)
        expect(values.config).toBe('app.json')

      })

      it('should apply default in parseFinal stage', () => {

        const schema = {
          verbose: { type: 'boolean', default: false },
          config: { type: 'string', default: 'app.json' },
        } as const

        const args = createStagedArgs([])
        const { values } = args.parseFinal(schema)

        expect(values.verbose).toBe(false)
        expect(values.config).toBe('app.json')

      })

      it('should apply default in parseFinal even after parse', () => {

        const schema = {
          verbose: { type: 'boolean', default: false },
        } as const

        const args = createStagedArgs([])
        const { stagedArgs } = args.parse({}) // skip global parsing
        const { values } = stagedArgs.parseFinal(schema)

        expect(values.verbose).toBe(false)

      })

      it('should override default with provided value in parseFinal', () => {

        const schema = {
          verbose: { type: 'boolean', default: false },
        } as const

        const args = createStagedArgs(['--verbose'])
        const { values } = args.parseFinal(schema)

        expect(values.verbose).toBe(true)

      })

    })

    describe('mixed and edge cases', () => {

      it('should handle mixed positional and options', () => {

        const schema = {
          verbose: { type: 'boolean' },
        } as const

        const args = createStagedArgs(['cmd', '--verbose', 'arg'])
        const { values, positionals } = args.parseFinal(schema)

        expect(values.verbose).toBe(true)
        expect(positionals).toEqual(['cmd', 'arg'])

      })

      it('should return only positionals with empty schema', () => {

        const schema = {} as const
        const args = createStagedArgs(['--unknown', 'pos1', 'pos2'])
        const { values, positionals } = args.parse(schema)

        expect(values).toEqual({})
        expect(positionals).toEqual(['pos1', 'pos2'])

      })

      it('should apply default when accessed via short', () => {

        const schema = {
          verbose: { type: 'boolean', short: 'v', default: true },
        } as const

        const args = createStagedArgs([])
        const { values } = args.parseFinal(schema)

        expect(values.verbose).toBe(true)

      })

    })

  })

})
