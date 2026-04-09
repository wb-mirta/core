import { mock } from 'vitest-mock-extended';
import { useGetDevice } from './get-device';
import { SimulatorInstance } from '#types';
import { setValueSilent } from '#dev';

export function createInstance(): SimulatorInstance {

  const getDevice = useGetDevice();

  function reset() {

    global.defineVirtualDevice = (deviceId, options) => {

      const controls = Object.keys(options.cells);

      for (const controlName of controls) {

        const value = options.cells[controlName].value;

        if (value !== undefined)
          setValueSilent(`${deviceId}/${controlName}`, value);

      }

      const device = mock<WbRules.Device>({
        getId() {

          return deviceId;

        },
        getCellId(cellName) {

          return `${deviceId}/${cellName}`;

        },
        isVirtual() {

          return true;

        },
        isControlExists(cellName) {

          return controls.includes(cellName);

        },
        getControl(cellName) {

          if (!controls.includes(cellName))
            return undefined;

          return global.getControl(`${deviceId}/${cellName}`);

        },
      });

      getDevice.defineDevice(deviceId, device);

      return device;

    };

  }

  reset();

  return {
    reset,
  };

}

let instance: SimulatorInstance | undefined;

/** Имитатор конструкции defineVirtualDevice. */
export function useDefineVirtualDevice() {

  return instance ??= createInstance();

}
