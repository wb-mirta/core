import { readFileSync } from 'node:fs'
import { fruit } from 'gradient-string'

const canUseColors = process.stdout.isTTY
  && process.stdout.getColorDepth() > 8

const data = readFileSync(
  new URL('./assets/logo.art', import.meta.url),
  'utf-8'
)

export const banner = canUseColors
  ? fruit(data)
  : data
