export class PromptCanceledError extends Error {
  constructor() {

    super()

    // Убедимся, что экземпляр имеет правильный прототип
    Object.setPrototypeOf(this, PromptCanceledError.prototype)

    this.name = 'PromptCanceledError'

    Error.captureStackTrace(this, PromptCanceledError)

  }
}
