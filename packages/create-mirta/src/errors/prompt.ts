export class PromptCanceledError extends Error {
  constructor() {

    super();

    this.name = 'PromptCanceledError';

    Error.captureStackTrace(this, PromptCanceledError);

  }
}
