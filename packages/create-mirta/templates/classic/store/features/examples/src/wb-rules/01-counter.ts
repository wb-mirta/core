import { useCounter } from '#wbm/counter'

log('Script: {}', __filename)

// Использует счетчик из модуля counter
const counter = useCounter()

// Увеличивает значение счетчика на 2
counter.increment()
counter.increment()

// Выводит в лог текущее значение счетчика
log('Counter Value: {}', counter.count)
