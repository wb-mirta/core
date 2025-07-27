import { useCounter } from '@wbm/counter'
import { useCounterStore } from '@wbm/counter-store'

const counter = useCounter()

counter.increment()
log(`Current Value: ${counter.count}`)

const counterStore = useCounterStore()
log(`Current Store Value: ${counterStore.count}`)
