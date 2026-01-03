import { PromptCanceledError } from '#errors/prompt'
import p, { type Options, type PromptObject } from 'prompts'

export async function prompts(questions: PromptObject | PromptObject[], options: Options = {}) {

  const po = {
    onCancel: () => {

      throw new PromptCanceledError()

    },
    ...options,
  }

  return await p(questions, po)

}
