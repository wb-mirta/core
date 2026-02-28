import { KNOWN_SSH_PORT } from '../constants';
import type { MirtaConnection } from '../types';

export { resolveConnection } from './resolve';

/**
 * Формирует строку назначения подключения в формате `user@host[:port]`.
 *
 * Порт включается только если отличается от стандартного (22).
 *
 * @param connection - Объект подключения.
 * @returns Строка вида `user@host` или `user@host:port`.
 *
 **/
export function getConnectionTarget(connection: MirtaConnection) {

  let target = `${connection.username}@${connection.hostname}`;

  if (connection.port && connection.port !== KNOWN_SSH_PORT)
    target += `:${connection.port}`;

  return target;

}
