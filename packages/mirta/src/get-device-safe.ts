/**
 * Позволяет получить объект для работы с указанным устройством.
 * @param deviceId Идентификатор устройства.
 *
 */
export function getDeviceSafe(
  deviceId: string,
  isReadyFunc = () => true
) {

  let device: WbRules.Device | undefined

  return {
    /** Возвращает существующий объект или пытается найти, если его ещё нет. */
    get safe() {

      return device ?? (
        isReadyFunc()
          ? device = getDevice(deviceId)
          : undefined
      )

    },
  }

}
