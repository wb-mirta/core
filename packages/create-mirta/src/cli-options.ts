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
  version: {
    type: 'boolean',
    short: 'v',
  },
  force: {
    type: 'boolean',
    short: 'f',
  },
  help: {
    type: 'boolean',
    short: 'h',
  },
  bare: {
    type: 'boolean',
    short: 'b',
  },
}) as const
