import { vi } from 'vitest'
import { mock } from 'vitest-mock-extended'

// Базовая (подавляющая) имитация API движка wb-rules.
// Для каждого файла с тестами этот код выполняется заново.
//
// Используется с целью перехвата и подавления обращений
// к отсутствующим на компьютере функциям контроллера.
//
// В файлах тестов можно переопределить поведение подавления
// на выдачу заготовленного ответа. Пригодится для симуляции
// внештатных ситуаций и оценки работы алгоритма
// в этих условиях.

const createLogger = () => {

  const logger: WbRules.Log = vi.fn() as WbRules.LogFunc as WbRules.Log

  logger.info = vi.fn()
  logger.debug = vi.fn()
  logger.warning = vi.fn()
  logger.error = vi.fn()

  return logger

}

global.module = mock<NodeJS.Module>()

global.log = createLogger()
global.dev = mock<WbRules.Dev>()
global.defineVirtualDevice = vi.fn()
global.getDevice = vi.fn(() => mock<WbRules.Device>({
  getControl: () => mock<WbRules.Control>(),
}))
global.getControl = vi.fn()
global.trackMqtt = vi.fn()
global.defineRule = vi.fn()
