import { createStagedArgs } from '#src/args'
import type { Result } from '#src/result'
import type { ParseError, SuggestFunc } from '#src/types'

function assertNoParseErrors<TData>(
  result: Result<TData, ParseError>
): asserts result is { hasErrors: false, data: TData } {

  if (!result.hasErrors)
    return

  const messages = result.errors.map((error) => {

    switch (error.type) {
      case 'unknown-option':
        return `Unknown option: ${error.option}` + (error.suggestion ? ` → did you mean '${error.suggestion}'?` : '')
      case 'missing-value':
        return `Missing value for option: ${error.option}`
      default:
        return `Parse error: ${JSON.stringify(error)}`
    }

  })

  throw new Error('Parsing failed:\n  - ' + messages.join('\n  - '))

}

describe('createStagedArgs', () => {

  describe('basic parsing', () => {

    it('should parse boolean flags', () => {

      const schema = { verbose: { type: 'boolean' } } as const
      const args = createStagedArgs(['--verbose'])

      const result = args.parseFinal(schema)
      assertNoParseErrors(result)
      const { values } = result.data

      expect(values.verbose).toBe(true)

    })

    it('should parse string options', () => {

      const schema = { config: { type: 'string' } } as const
      const args = createStagedArgs(['--config', 'file.json'])

      const result = args.parseFinal(schema)
      assertNoParseErrors(result)
      const { values } = result.data

      expect(values.config).toBe('file.json')

    })

    it('should parse positional arguments', () => {

      const schema = {} as const
      const args = createStagedArgs(['cmd', 'arg'])

      const result = args.parseFinal(schema)
      assertNoParseErrors(result)
      const { positionals } = result.data

      expect(positionals).toEqual(['cmd', 'arg'])

    })

    it('should handle option terminator --', () => {

      const schema = { help: { type: 'boolean' } } as const
      const args = createStagedArgs(['--help', '--', '--unknown'])

      const result = args.parseFinal(schema)
      assertNoParseErrors(result)
      const { values, positionals } = result.data

      expect(values.help).toBe(true)
      expect(positionals).toEqual(['--unknown'])

    })

    it('should support staged parsing', () => {

      const globalSchema = { verbose: { type: 'boolean' } } as const
      const cmdSchema = { force: { type: 'boolean' } } as const

      const args = createStagedArgs(['--verbose', 'deploy', '--force'])

      const result = args.parse(globalSchema)
      assertNoParseErrors(result)
      const { stagedArgs } = result.data

      const stagedResult = stagedArgs.parseFinal(cmdSchema)
      assertNoParseErrors(stagedResult)
      const { values } = stagedResult.data

      expect(values.force).toBe(true)

    })

    it('should not throw on unknown option in parse', () => {

      const schema = { help: { type: 'boolean' } } as const
      const args = createStagedArgs(['--unknown', '--help'])

      expect(() => args.parse(schema)).not.toThrow()

    })

  })

  describe('suggest option', () => {

    const mockSuggest: SuggestFunc
      = input => input === 'verbos' ? 'verbose' : undefined

    it('should suggest with unknown options', () => {

      const schema = {
        verbose: { type: 'boolean' },
      } as const

      const args = createStagedArgs(['--verbos'], {
        suggest: mockSuggest,
      })

      const result = args.parseFinal(schema)

      if (!result.hasErrors) {

        expect.fail('Expected parse to return errors for unknown option')
        return

      }

      expect(result.errors).toContainEqual({
        type: 'unknown-option',
        option: '--verbos',
        suggestion: 'verbose',
      })

    })

  })

})
