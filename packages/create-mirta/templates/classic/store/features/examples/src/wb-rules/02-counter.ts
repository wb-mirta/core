import { useCounter } from '#wbm/counter'
import { useCounterStore } from '#wbm/counter-store'

log('Script: {}', __filename)

// Использует счетчик из модуля counter
const counter = useCounter()

// Увеличивает значение счетчика на 1
counter.increment()
counter.increment()

// Выводит в лог текущее значение счетчика
log('Counter Value: {}', counter.count)

const store = useCounterStore()

// Выводит в лог значение напрямую из store
log('Value from store: {}, double from getter: {}', store.count, store.double)
