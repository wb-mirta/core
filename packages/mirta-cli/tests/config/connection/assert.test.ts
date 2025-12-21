import { assertConnectionIsValid } from '#src/config/connection/assert'

describe('assertConnectionIsValid', () => {

  it('should pass validation for minimal valid SSH connection', () => {

    const connection = {
      type: 'ssh',
      hostname: '192.168.42.1',
    }

    expect(() => {

      assertConnectionIsValid(connection)

    }).not.toThrow()

  })

  it('should pass validation for complete SSH connection', () => {

    const connection = {
      type: 'ssh',
      hostname: 'controller.local',
      port: 2222,
      username: 'root',
      key: '~/.ssh/id_ed25519',
      ttl: '15m',
      wsl: 'Ubuntu',
    }

    expect(() => {

      assertConnectionIsValid(connection)

    }).not.toThrow()

  })

  it('should throw when type is not ssh', () => {

    const connection = {
      type: 'ftp',
      hostname: '192.168.1.1',
    }

    expect(() => {

      assertConnectionIsValid(connection)

    }).toThrow('Only SSH connection type supported')

  })

  it('should throw when hostname is missing', () => {

    const connection = {
      type: 'ssh',
    }

    expect(() => {

      assertConnectionIsValid(connection)

    }).toThrow('hostname is required')

  })

  it('should throw when hostname is not a string', () => {

    const connection = {
      type: 'ssh',
      hostname: 123 as unknown as string,
    }

    expect(() => {

      assertConnectionIsValid(connection)

    }).toThrow('hostname is required and must be a string')

  })

  it('should throw when port is not an integer', () => {

    const connection = {
      type: 'ssh',
      hostname: '192.168.1.1',
      port: 22.5,
    }

    expect(() => {

      assertConnectionIsValid(connection)

    }).toThrow('port must be integer between 1 and 65535')

  })

  it('should throw when port is out of range (too low)', () => {

    const connection = {
      type: 'ssh',
      hostname: '192.168.1.1',
      port: 0,
    }

    expect(() => {

      assertConnectionIsValid(connection)

    }).toThrow('port must be integer between 1 and 65535')

  })

  it('should throw when port is out of range (too high)', () => {

    const connection = {
      type: 'ssh',
      hostname: '192.168.1.1',
      port: 65536,
    }

    expect(() => {

      assertConnectionIsValid(connection)

    }).toThrow('port must be integer between 1 and 65535')

  })

  it('should throw when username is empty string', () => {

    const connection = {
      type: 'ssh',
      hostname: '192.168.1.1',
      username: '   ',
    }

    expect(() => {

      assertConnectionIsValid(connection)

    }).toThrow('username must be a non-empty string')

  })

  it('should throw when username is not a string', () => {

    const connection = {
      type: 'ssh',
      hostname: '192.168.1.1',
      username: 123,
    }

    expect(() => {

      assertConnectionIsValid(connection)

    }).toThrow('username must be a non-empty string')

  })

  it('should throw when pkcs11 is not a string', () => {

    const connection = {
      type: 'ssh',
      hostname: '192.168.1.1',
      pkcs11: 123,
    }

    expect(() => {

      assertConnectionIsValid(connection)

    }).toThrow('pkcs11: path to identity must be a string')

  })

  it('should throw when key is not a string', () => {

    const connection = {
      type: 'ssh',
      hostname: '192.168.1.1',
      key: false,
    }

    expect(() => {

      assertConnectionIsValid(connection)

    }).toThrow('key: path to identity must be a string')

  })

  it('should throw when ttl is not a string', () => {

    const connection = {
      type: 'ssh',
      hostname: '192.168.1.1',
      ttl: 600,
    }

    expect(() => {

      assertConnectionIsValid(connection)

    }).toThrow('ttl must be a string')

  })

  it('should throw when ttl format is invalid', () => {

    const connection = {
      type: 'ssh',
      hostname: '192.168.1.1',
      ttl: '1h30',
    }

    expect(() => {

      assertConnectionIsValid(connection)

    }).toThrow('ttl must be in format <number>[smhd]')

  })

  it('should accept valid ttl formats', () => {

    const ttls = ['600', '10m', '1h', '2d', '1h30m', '10m30s']

    ttls.forEach((ttl) => {

      const connection = {
        type: 'ssh',
        hostname: '192.168.1.1',
        ttl,
      }

      expect(() => {

        assertConnectionIsValid(connection)

      }).not.toThrow()

    })

  })

  it('should throw when wsl is not a string', () => {

    const connection = {
      type: 'ssh',
      hostname: '192.168.1.1',
      wsl: true,
    }

    expect(() => {

      assertConnectionIsValid(connection)

    }).toThrow('wsl: distro name must be a string')

  })

})
