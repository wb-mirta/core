import type { MirtaConnection, WslDistroName } from '#src/config/types';
import { t } from '../i18n';
import { runCommandAsync } from './shell';

/**
 * Описание дистрибутива WSL.
 *
 * @since 0.4.0
 *
 **/
interface WslDistro {

  /**
   * Имя дистрибутива (например, 'Debian').
   *
   **/
  name: WslDistroName;

  /**
   * Версия WSL: 1 или 2.
   *
   **/
  version: number;

  /**
   * Является ли дистрибутивом по умолчанию.
   **/
  isDefault: boolean;

}

/**
 * Асинхронно проверяет, что WSL2 корректно настроен для выполнения команд.
 *
 * - Выполняет `wsl --list --verbose` через PowerShell
 * - Анализирует список дистрибутивов
 * - Проверяет версию WSL для указанного или дистрибутива по умолчанию
 *
 * Выбрасывает локализованные ошибки при проблемах.
 *
 * @param connection - Подключение, которое может указывать на конкретный дистрибутив WSL.
 * @throws Ошибка с текстом на русском языке, если:
 * - WSL не установлен
 * - Нет дистрибутивов
 * - Указанный дистрибутив не найден
 * - Дистрибутив не WSL2
 * - Дистрибутив по умолчанию не WSL2
 *
 * @since 0.4.0
 *
 **/
export async function assertWsl2ConfiguredAsync(connection: MirtaConnection) {

  try {

    // Запускаем wsl --list --verbose через PowerShell
    const { stdout } = await runCommandAsync(
      'powershell',
      ['$env:WSL_UTF8=1;', 'wsl', '--list', '--verbose']
    );

    const lines = stdout.split('\n').slice(1); // Пропускаем заголовок

    const distros = new Map<string, WslDistro>();

    let defaultDistro: WslDistro | undefined;

    // Парсим каждую строку вывода.
    for (const line of lines) {

      const match = /^(\*)?\s+(\S+)\s+(?:\S+)\s+(\d+)$/
        .exec(line.trim());

      if (!match)
        continue;

      const distro = {
        name: match[2] as WslDistroName,
        version: parseInt(match[3], 10),
        isDefault: match[1] === '*',
      };

      if (distro.isDefault)
        defaultDistro = distro;

      distros.set(distro.name.toLowerCase(), distro);

    }

    if (distros.size === 0)
      throw new Error(t('wsl.noDistros'));

    if (connection.wsl) {

      const targetDistro = distros.get(connection.wsl.toLowerCase());

      if (!targetDistro)
        throw new Error(t('wsl.distroNotFound', { name: connection.wsl }));

      if (targetDistro.version < 2)
        throw new Error(t('wsl.distroNotWsl2', { name: connection.wsl }));

      return;

    }

    if (!defaultDistro)
      throw new Error(t('wsl.noDefault'));

    if (defaultDistro.version >= 2)
      return;

    throw new Error(t('wsl.distroNotWsl2', { name: defaultDistro.name }));

  }
  catch (e: unknown) {

    // Пробрасываем внутренние ошибки валидации как есть.
    if (e instanceof Error && !('code' in e))
      throw e;

    if (e instanceof Error && 'code' in e && e.code === 'ENOENT')
      throw new Error(t('wsl.notInstalled'));

    throw new Error(t('wsl.error', {
      error: e instanceof Error ? e.message : String(e),
    }));

  }

}
