import type { DevicePlugin, PluginContext, TrackCallback } from 'mirta'

export type ExtractedPlugin<TPlugin>
  = TPlugin extends (...args: infer P) => infer R ? R : never

export function useDevicePlugin<TPlugin extends DevicePlugin>(
  deviceId: string,
  plugin: TPlugin
): ExtractedPlugin<TPlugin> {

  const track: TrackCallback = (controlId, callback) => {

    trackMqtt(
      `/devices/${deviceId}/controls/${controlId}`,
      ({ value }) => {

        callback(value)

      })

  }

  const context: PluginContext = {
    device: {
      id: deviceId,
      isReady: true,
    },
    track,
  }

  return plugin(context) as ExtractedPlugin<TPlugin>

}
