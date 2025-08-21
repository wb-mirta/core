import { defineConfig } from '@mirta/rollup'

export default defineConfig({
  dotenv: {
    /**
     * При использовании префикса, переменные
     * окружения будут отфильтрованы по нему.
     *
     * Например, префиксу APP_ соответствует
     * переменная окружения APP_NAME.
     *
     **/
    prefix: '^APP_',
  },
})
