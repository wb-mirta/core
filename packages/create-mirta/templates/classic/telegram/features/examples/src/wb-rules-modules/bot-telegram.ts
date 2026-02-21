import { defineTelegramBot, defineAuthorization } from '@mirta/chatbot'

const token = process.env.APP_TELEGRAM_TOKEN

if (!token)
  throw new Error('APP_TELEGRAM_TOKEN is required')

const allowedUserId = process.env.APP_TELEGRAM_USER

if (!allowedUserId)
  throw new Error('APP_TELEGRAM_USER is required')

const auth = defineAuthorization(a => a
  // Политика: администраторы
  .addPolicy('admin', p => p
    // Разрешить для указанного пользователя
    .allow(r => r
      .userId(allowedUserId)
    )
  )
)

/**
 * Функция для получения экземпляра Telegram-бота.
 *
 * Создаёт типобезопасный бот с привязкой к:
 * - Авторизации (`auth`)
 * - Конфигурации устройства (`deviceName`, `deviceTitle`)
 * - Токену бота
 * - Списку команд и колбэков с политиками доступа
 *
 * @returns Функция `useTelegramBot`, возвращающая синглтон-экземпляр бота
 *
 * @example
 * ```ts
 * const bot = useTelegramBot();
 * bot.onCommand('start', (ctx, reply) => { ... }); // Доступ только для 'admin'
 * ```
 **/
export const useTelegramBot = defineTelegramBot(auth, {
  deviceName: 'telegram',
  deviceTitle: 'Telegram Bot',
  token,
  commands: {
    start: { policy: 'admin' },
  },
  callbacks: {
    counter_reset: { policy: 'admin' },
    counter_decrease: { policy: 'admin' },
    counter_increase: { policy: 'admin' },
  },
})
