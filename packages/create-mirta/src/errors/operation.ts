/**
 * Ошибка, указывающая на отмену операции (например, через Ctrl+C).
 *
 * Соответствует коду выхода 130 (SIGINT).
 *
 * @since 0.4.0
 *
 **/
export class OperationCanceledError extends Error {
  constructor() {

    super();

    this.name = 'OperationCanceledError';

    Error.captureStackTrace(this, OperationCanceledError);

  }
}
