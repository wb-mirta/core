import { defineConfig } from './config'
import { DEFAULT_SSH_HOSTNAME, DEFAULT_SSH_USERNAME } from './constants'
import type { DeployFrom, DeployTo } from './types'

export default defineConfig({

  connections: {
    'default': `ssh://${DEFAULT_SSH_USERNAME}@${DEFAULT_SSH_HOSTNAME}`,
  },

  deploy: {
    mappings: {
      default: [
        {
          from: 'dist/es5/wb-rules-modules' as DeployFrom,
          to: '/mnt/data/etc/wb-rules-modules' as DeployTo,

          cleanup: true,
        },
        {
          from: 'dist/es5/wb-rules' as DeployFrom,
          to: '/mnt/data/etc/wb-rules' as DeployTo,

          cleanup: true,
          protect: ['alarms.conf'],
        },
      ],
    },
    profiles: {
      default: {
        connection: 'default',
        mappings: ['default'],
      },
    },
  },

})
