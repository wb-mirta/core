import type { DeviceContext } from './device'

export interface ControlSafe {
  safe: WbRules.Control | undefined
}

/**
 * Позволяет получить объект для работы с указанным контролом устройства.
 * @param context Контекст устройства, полученный из функций `tryConfigure`.
 * @param controlId Идентификатор контрола.
 *
 **/
export function getControlSafe(
  context: DeviceContext,
  controlId: string
): ControlSafe
/**
 * Позволяет получить объект для работы с указанным контролом устройства.
 * @param deviceId Идентификатор устройства.
 * @param controlId Идентификатор контрола.
 *
 **/
export function getControlSafe(
  deviceId: string,
  controlId: string,
  isReadyFunc: () => boolean
): ControlSafe
export function getControlSafe(
  context: DeviceContext | string,
  controlId: string,
  isReadyFunc = () => true
) {

  let control: WbRules.Control | undefined

  return {
    /** Возвращает существующий объект или пытается найти, если его ещё нет. */
    get safe() {

      if (control)
        return control

      if (typeof context === 'string') {

        return isReadyFunc()
          ? control = getControl(`${context}/${controlId}`)
          : undefined

      }
      else {

        return context.isReady
          ? control = getControl(`${context.deviceId}/${controlId}`)
          : undefined

      }

    },
  }

}
