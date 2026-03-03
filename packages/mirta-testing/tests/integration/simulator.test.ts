import { useSimulator } from '#simulator';

describe('CoreSimulator', () => {

  const simulator = useSimulator();

  beforeEach(() => {

    simulator.reset();

  });

  // ---------------------------------------------------------------------------

  describe('dev proxy', () => {

    it('should initialize with empty state after reset', () => {

      expect(dev['device/control']).toBeUndefined();

    });

    it('should store and retrieve a value', () => {

      dev['myDevice/myControl'] = 42;
      expect(dev['myDevice/myControl']).toBe(42);

    });

    it('should throw when setting a value without a control name (no slash)', () => {

      expect(() => {

        dev['noSlash'] = 1;

      }).toThrow('[dev] Missing control name in "noSlash"');

    });

    it('should publish to trackMqtt when any value is set', () => {

      const callback = vi.fn();
      trackMqtt('/devices/myDevice/controls/myControl', callback);

      dev['myDevice/myControl'] = 42;

      expect(callback).toHaveBeenCalledWith({
        topic: '/devices/myDevice/controls/myControl',
        value: 42,
      });

    });

    it('should trigger defineRule whenChanged when the value changes', () => {

      const ruleFn = vi.fn();
      defineRule({ whenChanged: 'myDevice/myControl', then: ruleFn });

      dev['myDevice/myControl'] = 'on';

      expect(ruleFn).toHaveBeenCalledWith('on');

    });

    it('should still publish to trackMqtt when setting the same value again', () => {

      dev['myDevice/myControl'] = 1;

      const callback = vi.fn();
      trackMqtt('/devices/myDevice/controls/myControl', callback);

      dev['myDevice/myControl'] = 1; // same value

      expect(callback).toHaveBeenCalledTimes(1);

    });

    it('should NOT trigger defineRule whenChanged when the value has not changed', () => {

      dev['myDevice/myControl'] = 1;

      const ruleFn = vi.fn();
      defineRule({ whenChanged: 'myDevice/myControl', then: ruleFn });

      dev['myDevice/myControl'] = 1; // same value

      expect(ruleFn).not.toHaveBeenCalled();

    });

    it('should clear state on simulator.reset()', () => {

      dev['myDevice/myControl'] = 42;
      simulator.reset();

      expect(dev['myDevice/myControl']).toBeUndefined();

    });

  });

  // ---------------------------------------------------------------------------

  describe('DefineRuleSimulator', () => {

    it('should trigger whenChanged callback for the matching topic', () => {

      const ruleFn = vi.fn();
      defineRule({ whenChanged: 'device/control', then: ruleFn });

      simulator.defineRule.run({ topic: 'device/control', value: 'hello' });

      expect(ruleFn).toHaveBeenCalledWith('hello');

    });

    it('should NOT trigger callback for a non-matching topic', () => {

      const ruleFn = vi.fn();
      defineRule({ whenChanged: 'device/control', then: ruleFn });

      simulator.defineRule.run({ topic: 'device/other', value: 'hello' });

      expect(ruleFn).not.toHaveBeenCalled();

    });

    it('should skip run when the value has not changed', () => {

      simulator.defineRule.run({ topic: 'device/control', value: 'on' }); // establish initial state

      const ruleFn = vi.fn();
      defineRule({ whenChanged: 'device/control', then: ruleFn });

      simulator.defineRule.run({ topic: 'device/control', value: 'on' }); // same value

      expect(ruleFn).not.toHaveBeenCalled();

    });

    it('should run even when the value has not changed when force is true', () => {

      simulator.defineRule.run({ topic: 'device/control', value: 'on' }); // establish initial state

      const ruleFn = vi.fn();
      defineRule({ whenChanged: 'device/control', then: ruleFn });

      simulator.defineRule.run({ topic: 'device/control', value: 'on' }, { force: true });

      expect(ruleFn).toHaveBeenCalledWith('on');

    });

    it('should handle an array of messages and trigger each matching rule', () => {

      const fn1 = vi.fn();
      const fn2 = vi.fn();

      defineRule({ whenChanged: 'device/control1', then: fn1 });
      defineRule({ whenChanged: 'device/control2', then: fn2 });

      simulator.defineRule.run([
        { topic: 'device/control1', value: 1 },
        { topic: 'device/control2', value: 2 },
      ]);

      expect(fn1).toHaveBeenCalledWith(1);
      expect(fn2).toHaveBeenCalledWith(2);

    });

    it('should update dev state silently without triggering trackMqtt (no side effects)', () => {

      const mqttCallback = vi.fn();
      trackMqtt('/devices/device/controls/control', mqttCallback);

      simulator.defineRule.run({ topic: 'device/control', value: 'silent' });

      expect(mqttCallback).not.toHaveBeenCalled();

    });

    it('should clear registered rules on reset()', () => {

      const ruleFn = vi.fn();
      defineRule({ whenChanged: 'device/control', then: ruleFn });
      simulator.reset();

      simulator.defineRule.run({ topic: 'device/control', value: 'test' });

      expect(ruleFn).not.toHaveBeenCalled();

    });

    it('should not raise an event when no matching whenChanged rule is registered', () => {

      // Ensures run() does not throw and silently processes unmatched topics
      expect(() => {

        simulator.defineRule.run({ topic: 'device/unregistered', value: 1 });

      }).not.toThrow();

    });

  });

  // ---------------------------------------------------------------------------

  describe('TrackMqttSimulator', () => {

    it('should deliver a published message to the matching listener', () => {

      const callback = vi.fn();
      trackMqtt('/devices/device/controls/control', callback);

      simulator.trackMqtt.publish({ topic: '/devices/device/controls/control', value: 42 });

      expect(callback).toHaveBeenCalledWith({
        topic: '/devices/device/controls/control',
        value: 42,
      });

    });

    it('should NOT deliver a message to a non-matching listener', () => {

      const callback = vi.fn();
      trackMqtt('/devices/device/controls/other', callback);

      simulator.trackMqtt.publish({ topic: '/devices/device/controls/control', value: 1 });

      expect(callback).not.toHaveBeenCalled();

    });

    it('should handle an array of messages', () => {

      const callback = vi.fn();
      trackMqtt('/devices/device/controls/control', callback);

      simulator.trackMqtt.publish([
        { topic: '/devices/device/controls/control', value: 1 },
        { topic: '/devices/device/controls/control', value: 2 },
      ]);

      expect(callback).toHaveBeenCalledTimes(2);
      expect(callback).toHaveBeenNthCalledWith(1, { topic: '/devices/device/controls/control', value: 1 });
      expect(callback).toHaveBeenNthCalledWith(2, { topic: '/devices/device/controls/control', value: 2 });

    });

    it('should sync dev state silently when publishing a device/control topic', () => {

      simulator.trackMqtt.publish({
        topic: '/devices/device/controls/control',
        value: 'synced',
      });

      expect(dev['device/control']).toBe('synced');

    });

    it('should NOT sync dev state for non-device topics', () => {

      simulator.trackMqtt.publish({ topic: '/some/other/topic', value: 'x' });

      expect(dev['/some/other/topic']).toBeUndefined();

    });

    it('withDevice should publish to the correct trackMqtt listener', () => {

      const callback = vi.fn();
      trackMqtt('/devices/myDevice/controls/myControl', callback);

      simulator.trackMqtt
        .withDevice('myDevice')
        .publish('myControl', 99);

      expect(callback).toHaveBeenCalledWith({
        topic: '/devices/myDevice/controls/myControl',
        value: 99,
      });

    });

    it('withDevice should support chaining multiple publishes', () => {

      const cb1 = vi.fn();
      const cb2 = vi.fn();
      trackMqtt('/devices/dev/controls/c1', cb1);
      trackMqtt('/devices/dev/controls/c2', cb2);

      simulator.trackMqtt.withDevice('dev').publish('c1', 1).publish('c2', 2);

      expect(cb1).toHaveBeenCalledWith({ topic: '/devices/dev/controls/c1', value: 1 });
      expect(cb2).toHaveBeenCalledWith({ topic: '/devices/dev/controls/c2', value: 2 });

    });

    it('should clear listeners on reset()', () => {

      const callback = vi.fn();
      trackMqtt('/devices/device/controls/control', callback);
      simulator.reset();

      simulator.trackMqtt.publish({ topic: '/devices/device/controls/control', value: 1 });

      expect(callback).not.toHaveBeenCalled();

    });

  });

  // ---------------------------------------------------------------------------

  describe('GetControlSimulator', () => {

    it('getValue should return the value previously set via dev', () => {

      dev['device/control'] = 'hello';

      expect(getControl('device/control')?.getValue()).toBe('hello');

    });

    it('getValue should return undefined when no value has been set', () => {

      expect(getControl('device/control')?.getValue()).toBeUndefined();

    });

    it('setValue should write to dev and trigger trackMqtt listeners', () => {

      const callback = vi.fn();
      trackMqtt('/devices/device/controls/control', callback);

      getControl('device/control')?.setValue('newValue');

      expect(callback).toHaveBeenCalledWith({
        topic: '/devices/device/controls/control',
        value: 'newValue',
      });

    });

    it('setValue with an object should extract the value property', () => {

      getControl('device/control')?.setValue({ value: 'extracted' });

      expect(dev['device/control']).toBe('extracted');

    });

    it('defineValue should set an initial value accessible via getControl', () => {

      simulator.getControl.defineValue('device', 'control', 123);

      expect(getControl('device/control')?.getValue()).toBe(123);

    });

    it('defineValues should set multiple initial values', () => {

      simulator.getControl.defineValues([
        { deviceId: 'dev1', controlId: 'c1', value: 'a' },
        { deviceId: 'dev2', controlId: 'c2', value: 'b' },
      ]);

      expect(getControl('dev1/c1')?.getValue()).toBe('a');
      expect(getControl('dev2/c2')?.getValue()).toBe('b');

    });

  });

  // ---------------------------------------------------------------------------

  describe('full integration', () => {

    it('writing to dev triggers the full chain: dev → trackMqtt → defineRule', () => {

      const mqttCallback = vi.fn();
      const ruleCallback = vi.fn();

      trackMqtt('/devices/device/controls/control', mqttCallback);
      defineRule({ whenChanged: 'device/control', then: ruleCallback });

      dev['device/control'] = 'trigger';

      expect(mqttCallback).toHaveBeenCalledWith({
        topic: '/devices/device/controls/control',
        value: 'trigger',
      });
      expect(ruleCallback).toHaveBeenCalledWith('trigger');

    });

    it('trackMqtt.publish should NOT trigger defineRule (prevents recursion)', () => {

      const ruleCallback = vi.fn();
      defineRule({ whenChanged: 'device/control', then: ruleCallback });

      simulator.trackMqtt.publish({
        topic: '/devices/device/controls/control',
        value: 'test',
      });

      expect(ruleCallback).not.toHaveBeenCalled();

    });

    it('defineRule.run should NOT trigger trackMqtt listeners (prevents recursion)', () => {

      const mqttCallback = vi.fn();
      trackMqtt('/devices/device/controls/control', mqttCallback);

      simulator.defineRule.run({ topic: 'device/control', value: 'test' });

      expect(mqttCallback).not.toHaveBeenCalled();

    });

    it('getControl.setValue triggers the full chain via dev proxy', () => {

      const mqttCallback = vi.fn();
      const ruleCallback = vi.fn();

      trackMqtt('/devices/device/controls/control', mqttCallback);
      defineRule({ whenChanged: 'device/control', then: ruleCallback });

      getControl('device/control')?.setValue('via-set-value');

      expect(mqttCallback).toHaveBeenCalledWith({
        topic: '/devices/device/controls/control',
        value: 'via-set-value',
      });
      expect(ruleCallback).toHaveBeenCalledWith('via-set-value');

    });

    it('dev state remains consistent across all simulator interactions', () => {

      // set via dev proxy
      dev['device/control'] = 'initial';
      expect(dev['device/control']).toBe('initial');

      // update via trackMqtt.publish (setValueSilent)
      simulator.trackMqtt.publish({ topic: '/devices/device/controls/control', value: 'via-mqtt' });
      expect(dev['device/control']).toBe('via-mqtt');

      // update via defineRule.run (setValueSilent)
      simulator.defineRule.run({ topic: 'device/control', value: 'via-rule' });
      expect(dev['device/control']).toBe('via-rule');

      // read via getControl
      expect(getControl('device/control')?.getValue()).toBe('via-rule');

    });

  });

});
