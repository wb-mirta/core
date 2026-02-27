import { runCommand } from './utils/run-command.mjs';

async function run() {

  await runCommand('pnpm', [

    // Для всех пакетов
    '--filter=./packages/*',

    // Кроме тех, что собрали в режиме bootstrap
    '--filter=!@mirta/basics',
    '--filter=!@mirta/polyfills',
    '--filter=!@mirta/package',
    '--filter=!@mirta/workspace',
    '--filter=!@mirta/rollup',
    '--filter=!@mirta/testing',
    '--filter=!mirta',

    // Для всех примеров
    '--filter=./examples/*/*',

    // Выполняем сборку в режиме монорепозитория
    'run', 'build:mono',

  ], {
    shell: true,
    stdio: 'inherit',
  }).result;

}

await run();
