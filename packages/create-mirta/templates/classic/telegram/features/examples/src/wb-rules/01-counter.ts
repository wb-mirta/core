import type { MessageBuilder } from '@mirta/chatbot'
import { useTelegramBot } from '#wbm/bot-telegram'
import { useCounter } from '#wbm/counter'

// Общий набор кнопок
const messageBuilder = (b: MessageBuilder) => b
  .inlineKeyboard(k => k
    .row(r => r
      .text('Сброс', t => t
        .style('danger')
        .callback('counter_reset')
      )
      .text('Уменьшить', t => t
        .callback('counter_decrease')
      )
      .text('Увеличить', t => t
        .callback('counter_increase')
      )
    )
  )

const counter = useCounter()
const bot = useTelegramBot()

const getFormattedValue = () => 'Значение счётчика: {}'.format(counter.count)

// === Команды мессенджера ===

bot.onCommand('start', (_context, reply) => {

  reply(getFormattedValue(), messageBuilder)

})

// === Кнопки мессенджера ===

bot.onCallback('counter_reset', ({ chatId }, done) => {

  counter.reset()
  done()

  bot.sendMessage(chatId, getFormattedValue(), messageBuilder)

})

bot.onCallback('counter_decrease', ({ chatId }, done) => {

  counter.decrement()
  done()

  bot.sendMessage(chatId, getFormattedValue(), messageBuilder)

})

bot.onCallback('counter_increase', ({ chatId }, done) => {

  counter.increment()
  done()

  bot.sendMessage(chatId, getFormattedValue(), messageBuilder)

})
