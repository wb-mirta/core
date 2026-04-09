import { useSimulator } from '#simulator';

const sim = useSimulator();

describe('defineVirtualDevice', () => {

  beforeEach(() => {

    sim.reset();

  });

  it('should create a virtual device with correct title and cells', () => {

    const deviceJson: WbRules.DeviceOptions = {
      title: 'Test Device',
      cells: {
        power: {
          title: 'Power',
          type: 'switch',
          value: false,
        },
        level: {
          title: 'Level',
          type: 'range',
          value: 50,
        },
      },
    };

    const device = defineVirtualDevice('testDevice', deviceJson);

    expect(device).toBeDefined();
    expect(device.isVirtual()).toBe(true);

  });

  it('should be retrievable via getDevice', () => {

    defineVirtualDevice('thermostat', {
      title: 'Thermostat',
      cells: {
        target: { type: 'range', value: 22 },
      },
    });

    const device = getDevice('thermostat');
    expect(device).toBeDefined();
    expect(device?.isVirtual()).toBe(true);

  });

  it('should make controls accessible via getControl', () => {

    defineVirtualDevice('light', {
      title: 'Light',
      cells: {
        switch: { type: 'switch', value: false },
        brightness: { type: 'range', value: 75 },
      },
    });

    const switchCtrl = getControl('light/switch');
    const brightnessCtrl = getControl('light/brightness');

    expect(switchCtrl).toBeDefined();
    expect(brightnessCtrl).toBeDefined();
    expect(switchCtrl?.getValue()).toBe(false);
    expect(brightnessCtrl?.getValue()).toBe(75);

  });

  it('should return undefined for non-existent control via getControl', () => {

    defineVirtualDevice('sensor', {
      title: 'Sensor',
      cells: {
        temperature: { type: 'value', value: 22.5 },
      },
    });

    const ctrl = getControl('sensor/humidity');
    expect(ctrl).toBeUndefined();

  });

  it('should allow setting and getting control value via getControl.setValue()', () => {

    defineVirtualDevice('plug', {
      title: 'Plug',
      cells: {
        status: { type: 'switch', value: false },
      },
    });

    const statusCtrl = getControl('plug/status');
    statusCtrl?.setValue(true);

    expect(dev['plug/status']).toBe(true);
    expect(statusCtrl?.getValue()).toBe(true);

  });

  it('should sync value changes via dev proxy to getControl.getValue()', () => {

    defineVirtualDevice('fan', {
      title: 'Fan',
      cells: {
        speed: { type: 'range', value: 0 },
      },
    });

    dev['fan/speed'] = 80;

    const speedCtrl = getControl('fan/speed');
    expect(speedCtrl?.getValue()).toBe(80);

  });

  it('should correctly report control existence with isControlExists', () => {

    const device = defineVirtualDevice('camera', {
      title: 'Camera',
      cells: {
        motion: { type: 'switch', value: false },
      },
    });

    expect(device.isControlExists('motion')).toBe(true);
    expect(device.isControlExists('unknown')).toBe(false);

  });

  it('should reset all virtual devices on simulator.reset()', () => {

    defineVirtualDevice('bulb', {
      title: 'Bulb',
      cells: {
        state: { type: 'switch', value: true },
      },
    });

    sim.reset();

    const device = getDevice('bulb');
    const ctrl = getControl('bulb/state');

    expect(device).toBeUndefined();
    expect(ctrl).toBeUndefined();
    expect(dev['bulb/state']).toBeUndefined();

  });

  it('should support multiple virtual devices with overlapping control names without conflict', () => {

    defineVirtualDevice('kitchen/light', {
      title: 'Kitchen Light',
      cells: {
        power: { type: 'switch', value: false },
      },
    });

    defineVirtualDevice('bedroom/light', {
      title: 'Bedroom Light',
      cells: {
        power: { type: 'switch', value: true },
      },
    });

    expect(getControl('kitchen/light/power')?.getValue()).toBe(false);
    expect(getControl('bedroom/light/power')?.getValue()).toBe(true);

  });

  it('should work correctly with setInterval toggling a control value', () => {

    vi.useFakeTimers();

    defineVirtualDevice('toggleDev', {
      title: 'Toggle Device',
      cells: {
        state: { type: 'switch', value: false },
      },
    });

    const ctrl = getControl('toggleDev/state');
    let toggleCount = 0;

    // Запускаем интервал
    setInterval(() => {

      ctrl?.setValue(!ctrl.getValue());
      toggleCount++;

    }, 1000);

    // Продвигаем время
    vi.advanceTimersByTime(3000);

    expect(toggleCount).toBe(3);
    expect(ctrl?.getValue()).toBe(true); // false → true → false → true

    vi.useRealTimers();

  });

});
