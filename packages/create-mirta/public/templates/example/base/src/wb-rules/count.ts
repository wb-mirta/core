import { useCounter } from '@wbm/counter'

const counter = useCounter()

counter.increment()
log(`Current Value: ${counter.count}`)
