import p, { type Options, type PromptObject } from 'prompts';

export class PromptCanceledError extends Error {
  constructor() {

    super();

    // Убедимся, что экземпляр имеет правильный прототип
    Object.setPrototypeOf(this, PromptCanceledError.prototype);

    this.name = 'PromptCanceledError';

    Error.captureStackTrace(this, PromptCanceledError);

  }
}

/**
 * @param {import('prompts').PromptObject<string> | Array<import('prompts').PromptObject<string>>} questions
 * @param {import('prompts').Options} options
 */
export async function prompts(questions: PromptObject | PromptObject[], options?: Options) {

  const po = options ?? {
    onCancel: () => {

      throw new PromptCanceledError();

    },
  };

  return await p(questions, po);

}
