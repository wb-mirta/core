import { t } from '#i18n'
import { prompts } from '#utils/prompts'
import type { PromptObject } from 'prompts'
import { DEFAULT_SSH_HOSTNAME, DEFAULT_SSH_USERNAME, KNOWN_SSH_PORT } from './constants'
import { hostnameRegex, parseUrl, usernameRegex } from './parser'

const rutokenLib = 'pkcs11=/opt/aktivco/rutokenecp/amd64/librtpkcs11ecp.so'

interface AddressInput {

  username: string
  hostname: string
  port?: string | number
  rutoken?: boolean

}

function createConnectionString(input: AddressInput) {

  let connection = `ssh://${input.username}@${input.hostname}`

  if (input.port !== KNOWN_SSH_PORT)
    connection += `:${input.port}`

  if (input.rutoken)
    connection += `;${rutokenLib}`

  return connection

}

export async function resolveConnectionStringAsync(
  input: string | undefined,
  rutoken: boolean | undefined
): Promise<string> {

  if (input) {

    const parsed = parseUrl(input)

    /* eslint-disable @typescript-eslint/prefer-nullish-coalescing */

    return createConnectionString({
      username: parsed.username || DEFAULT_SSH_USERNAME,
      hostname: parsed.hostname || DEFAULT_SSH_HOSTNAME,
      port: parsed.port || KNOWN_SSH_PORT,
      rutoken,
    })

    /* eslint-enable @typescript-eslint/prefer-nullish-coalescing */

  }

  const questions: PromptObject[] = [
    {
      type: 'text',
      name: 'username',
      message: t('ssh.username'),
      initial: DEFAULT_SSH_USERNAME,
      validate: (value: string) => {

        if (value.trim().length === 0)
          return t('validation.required')

        if (!usernameRegex.test(value))
          return t('validation.invalidFormat')

        return true

      },
    },
    {
      type: 'text',
      name: 'hostname',
      message: t('ssh.hostname'),
      initial: DEFAULT_SSH_HOSTNAME,
      validate: (value: string) => {

        if (value.trim().length === 0)
          return t('validation.required')

        if (!hostnameRegex.test(value))
          return t('validation.invalidFormat')

        return true

      },
    },
    {
      type: 'number',
      name: 'port',
      message: t('ssh.port'),
      initial: KNOWN_SSH_PORT,
      min: 1,
      max: 65535,
    },
  ]

  if (rutoken === undefined)
    questions.push({
      type: 'toggle',
      name: 'rutoken',
      message: t('ssh.rutoken'),
      initial: false,
      active: t('yes'),
      inactive: t('no'),
    })

  const response = await prompts(questions) as {
    username: string
    hostname: string
    port: number
    rutoken?: boolean
  }

  return createConnectionString({
    username: response.username,
    hostname: response.hostname,
    port: response.port,
    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
    rutoken: rutoken || response.rutoken,
  })

}
