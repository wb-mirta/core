import { t } from '#i18n/index'
import { logger } from '#utils/logger'
import { prompts } from '#utils/prompts'
import type { PromptObject } from 'prompts'

export async function resolveTelegramInfoAsync() {

  logger.step(t('telegram.caption'))

  const questions: PromptObject[] = [
    {
      type: 'text',
      name: 'token',
      message: t('telegram.token'),
      validate: (value: string) => {

        if (value.trim().length === 0)
          return t('validation.required')
        else
          return true

      },
    },
    {
      type: 'text',
      name: 'user',
      message: t('telegram.user'),
      validate: (value: string) => {

        const trimmedValue = value.trim()

        if (trimmedValue.length === 0)
          return t('validation.required')

        if (/^[0-9]+$/.test(trimmedValue))
          return true

        return t('validation.digitsOnly')

      },
    },
  ]

  const { token, user } = await prompts(questions) as { token: string, user: string }

  return {
    token: token.trim(),
    user: user.trim(),
  }

}
