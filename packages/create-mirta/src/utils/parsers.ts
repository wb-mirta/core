export const urlRegex = /(?:(?<username>.+?)@)?(?:(?<hostname>[^:@\s]+))?(?::(?<port>\d+))?/

interface ParsedAddress {

  username?: string
  hostname?: string
  port?: string
}

export function parseUrl(value?: string): ParsedAddress {

  if (!value)
    return {}

  return (urlRegex.exec(value))?.groups ?? {}

}
