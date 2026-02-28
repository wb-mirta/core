import nodePath from 'node:path';

/**
 * Преобразует путь из формата Windows в формат POSIX.
 *
 * Заменяет все обратные слеши (`\`) на прямые (`/`), что необходимо для кросс-платформенной
 * совместимости, особенно при сравнении путей или работе с инструментами сборки,
 * которые ожидают стандартизированный формат пути.
 *
 * @param path - Входной путь, который может содержать разделители Windows (`\`).
 * @returns Путь, в котором все разделители заменены на `/`.
 *
 * @example
 * ```ts
 * toPosix('C:\\projects\\app\\src\\index.ts')
 * // Результат: 'C:/projects/app/src/index.ts'
 * ```
 *
 * @remarks
 * Функция использует {@link nodePath.win32.sep} и {@link nodePath.posix.sep} для получения
 * платформенно-зависимых разделителей, что делает её надёжной независимо от ОС,
 * на которой выполняется код.
 *
 * @since 0.4.0
 *
 **/
export function toPosix(path: string): string;
export function toPosix(path: string | undefined): string | undefined;
export function toPosix(path: string | undefined): string | undefined {

  if (path === '' || path === undefined)
    return path;

  return path.replaceAll(
    nodePath.win32.sep,
    nodePath.posix.sep
  );

}
