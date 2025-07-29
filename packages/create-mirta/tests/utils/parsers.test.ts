import { parseUrl } from '../../src/utils/parsers'

describe('Regex tests for username@hostname:port format', () => {

  it('Parses full string with all parts', () => {

    const input = 'root@wirenboard:22'
    const match = parseUrl(input)

    expect(match.username).toBe('root')
    expect(match.hostname).toBe('wirenboard')
    expect(match.port).toBe('22')

  })

  // Default format
  it('Works without port number', () => {

    const input = 'root@wirenboard'
    const match = parseUrl(input)

    expect(match.username).toBe('root')
    expect(match.hostname).toBe('wirenboard')
    expect(match.port).toBeUndefined()

  })

  // To prompt missing parts later
  it('Works without username part', () => {

    const input = 'wirenboard:22'
    const match = parseUrl(input)

    expect(match.username).toBeUndefined()
    expect(match.hostname).toBe('wirenboard')
    expect(match.port).toBe('22')

  })

  // To prompt missing parts later
  it('Works without hostname', () => {

    const input = 'root@'
    const match = parseUrl(input)

    expect(match.username).toBe('root')
    expect(match.hostname).toBeUndefined()
    expect(match.port).toBeUndefined()

  })

  // To prompt missing parts later
  it('Works without hostname', () => {

    const input = 'root@:22'
    const match = parseUrl(input)

    expect(match.username).toBe('root')
    expect(match.hostname).toBeUndefined()
    expect(match.port).toBe('22')

  })

  // To prompt missing parts later
  it('Works with hostname only', () => {

    const input = 'wirenboard'
    const match = parseUrl(input)

    expect(match.username).toBeUndefined()
    expect(match.hostname).toBe('wirenboard')
    expect(match.port).toBeUndefined()

  })

  it('IPv4: Parses full string with all parts', () => {

    const input = 'root@10.200.200.1:22'
    const match = parseUrl(input)

    expect(match.username).toBe('root')
    expect(match.hostname).toBe('10.200.200.1')
    expect(match.port).toBe('22')

  })

})
