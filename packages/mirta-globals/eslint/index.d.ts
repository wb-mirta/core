declare interface GlobalsMirta {
  readonly 'log': false
  readonly 'dev': false
  readonly 'timers': false
  readonly 'defineRule': false
  readonly 'defineAlias': false
  readonly 'defineVirtualDevice': false
  readonly 'getDevice': false
  readonly 'getControl': false
  readonly 'startTicker': false
  readonly 'startTimer': false
  readonly 'spawn': false
  readonly 'runShellCommand': false
  readonly 'readConfig': false
  readonly 'trackMqtt': false
  readonly 'publish': false
  readonly 'PersistentStorage': false
  readonly 'Notify': false
}

declare const globals: GlobalsMirta

export = globals
