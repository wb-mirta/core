export const urlRegex = /^(?:(?<username>[a-z][-a-z0-9_.]*)@)?(?:(?<hostname>[^:@\s]+))?(?::(?<port>\d+))?$/

export const usernameRegex = /^[a-z][-a-z0-9_.]*$/
export const hostnameRegex = /^[^:@\s]+$/

interface ParsedUrl {

  username?: string
  hostname?: string
  port?: string

}

export function parseUrl(

  input: string | undefined

): ParsedUrl {

  if (!input)
    return {}

  return (urlRegex.exec(input))?.groups ?? {}

}
