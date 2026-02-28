import { useCounter } from '#wbm/counter';

log('Script: {}', __filename);

// Использует счетчик из модуля counter
const counter = useCounter();

// Увеличивает значение счетчика на 1
counter.increment();

// Выводит в лог текущее значение счетчика
log('Counter Value: {}', counter.count);
