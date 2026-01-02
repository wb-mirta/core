import { parseUrl } from '#connection/parser'

describe('Regex tests for username@hostname:port format', () => {

  it('Parses full string with all parts', () => {

    const input = 'root@wirenboard:22'
    const match = parseUrl(input)

    expect(match.username).toBe('root')
    expect(match.hostname).toBe('wirenboard')
    expect(match.port).toBe('22')

  })

  it('Works without port number', () => {

    const input = 'root@wirenboard'
    const match = parseUrl(input)

    expect(match.username).toBe('root')
    expect(match.hostname).toBe('wirenboard')
    expect(match.port).toBeUndefined()

  })

  it('Works without username part', () => {

    const input = 'wirenboard:22'
    const match = parseUrl(input)

    expect(match.username).toBeUndefined()
    expect(match.hostname).toBe('wirenboard')
    expect(match.port).toBe('22')

  })

  it('Works without hostname', () => {

    const input = 'root@'
    const match = parseUrl(input)

    expect(match.username).toBe('root')
    expect(match.hostname).toBeUndefined()
    expect(match.port).toBeUndefined()

  })

  it('Works without hostname but with port', () => {

    const input = 'root@:22'
    const match = parseUrl(input)

    expect(match.username).toBe('root')
    expect(match.hostname).toBeUndefined()
    expect(match.port).toBe('22')

  })

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
