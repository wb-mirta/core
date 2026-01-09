declare global {
  namespace NodeJS {
    //
    // Здесь можно зарегистрировать собственные
    // переменные окружения и добавить им аннотацию в формате JSDoc.
    //
    interface ProcessEnv {
      /** Пример зарегистрированной переменной. */
      APP_NAME?: string
    }
  }
}

export { }
