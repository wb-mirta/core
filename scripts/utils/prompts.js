import p from 'prompts'

export function PromptCanceledError() {

  if (Error.captureStackTrace) {

    Error.captureStackTrace(this, PromptCanceledError)

  }
  else {

    this.stack = (new Error()).stack

  }

}

PromptCanceledError.prototype = Object.create(Error.prototype)

/**
 * @param {import('prompts').PromptObject<string> | Array<import('prompts').PromptObject<string>>} questions
 * @param {import('prompts').Options} options
 */
export async function prompts(questions, options) {

  const po = options || {
    onCancel: () => {

      throw new PromptCanceledError()

    },
  }

  return await p(questions, po)

}
