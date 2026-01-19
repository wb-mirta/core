describe('String.prototype.format', () => {

  it('should be defined on String prototype', () => {

    expect(String.prototype).toHaveProperty('format')
    expect(typeof String.prototype.format).toBe('function')

  })

  it('should replace {} with arguments', () => {

    expect('a={} b={}'.format('q', 42)).toBe('a=q b=42')
    expect('Hello, {}'.format('world')).toBe('Hello, world')
    expect('{} + {} = {}'.format(1, 2, 3)).toBe('1 + 2 = 3')

  })

  it('should escape {{ and }} to { and }', () => {

    expect('a={} {{}}'.format('q')).toBe('a=q {}')
    expect('{{key}} = {}'.format('value')).toBe('{key} = value')
    expect('Left {{, right }}'.format()).toBe('Left {, right }')

  })

  it('should handle empty arguments', () => {

    expect('a={} b={}'.format()).toBe('a= b=')
    expect('No args'.format()).toBe('No args')

  })

  it('should append extra arguments at the end with space', () => {

    expect('abc {}!'.format(1, 2, 3)).toBe('abc 1! 2 3')
    expect('x={}'.format('a', 'b')).toBe('x=a b')
    expect('none'.format('a', 'b')).toBe('none a b')

  })

  it('should add extra space if string already ends with space', () => {

    expect('trailing {} '.format('x', 'y')).toBe('trailing x  y')

  })

  it('should handle mixed escape and placeholders', () => {

    expect('Hello {{}} {}!'.format('Alice')).toBe('Hello {} Alice!')
    expect('{{{}}} is not {}'.format('name', 'value')).toBe('{name} is not value')

  })

  it('should not replace { without matching }', () => {

    expect('unclosed { brace'.format('x')).toBe('unclosed { brace x')

  })

  it('should not replace } without matching {', () => {

    expect('unopened } brace'.format('x')).toBe('unopened } brace x')

  })

  it('should handle empty string', () => {

    expect(''.format('a', 'b')).toBe(' a b')
    expect(''.format()).toBe('')

  })

  it('should convert non-string arguments', () => {

    expect('bool={} num={}'.format(true, 42)).toBe('bool=true num=42')

  })

})

describe('String.prototype.xformat', () => {

  it('should be defined on String prototype', () => {

    expect(String.prototype).toHaveProperty('xformat')
    expect(typeof String.prototype.xformat).toBe('function')

  })

  it('throws on any call', () => {

    expect(() => ''.xformat()).toThrow()
    expect(() => 'a'.xformat()).toThrow()
    expect(() => 'a'.xformat('x')).toThrow()
    expect(() => 'a'.xformat(1, 2, 3)).toThrow()

  })

})
