export const featureFlags = ({
  default: {
    type: 'boolean',
  },
  eslint: {
    type: 'boolean',
  },
  vitest: {
    type: 'boolean',
  },
  store: {
    type: 'boolean',
  },
}) as const

export const allOptions = ({
  ...featureFlags,
  ssh: {
    type: 'string',
  },
  rutoken: {
    type: 'boolean',
  },
  version: {
    type: 'boolean',
    short: 'v',
  },
  force: {
    type: 'boolean',
    short: 'f',
  },
  bare: {
    type: 'boolean',
    short: 'b',
  },
  help: {
    type: 'boolean',
    short: 'h',
  },
}) as const
