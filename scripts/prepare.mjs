import { runCommand } from './utils/run-command.mjs'

async function run() {

  await runCommand('pnpm', [
    '--filter', '@mirta/rollup',
    'run', 'build:mono',
  ], {
    shell: true,
    stdio: 'inherit',
  }).result

  await runCommand('pnpm', [
    '--filter', '@mirta/testing...',
    '--filter', '!@mirta/rollup',
    'run', 'build:mono',
  ], {
    shell: true,
    stdio: 'inherit',
  }).result

}

await run()
