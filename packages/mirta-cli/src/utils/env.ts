import { loadEnv as _loadEnv } from '@mirta/env-loader'

let isLoaded = false

export function loadEnv(rootDir: string, cwd?: string) {

  if (isLoaded)
    return

  const env = _loadEnv({

    cwd,
    rootDir,

    prefix: ['WB_', 'MIRTA_'],

  })

  // Объединяем с текущим process.env
  Object.assign(process.env, env)

  isLoaded = true

}

export function replaceEnvVars(input: string): string {

  return input.replace(/\$\{([^}]+)\}/g, (_, key: string) => {

    const value = process.env[key]

    if (value === undefined)
      throw new Error(`Environment variable not set: ${key}`)

    return value

  })

}

export function __resetInternalState() {

  if (!__TEST__)
    return

  isLoaded = false

}
