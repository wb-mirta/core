describe('wb-rules composite types', () => {

  it('Should expand type "text"', () => {

    const controlOptions: WbRules.ControlOptions = {
      type: 'text',

    }

    expectTypeOf(controlOptions.enum)
      .toEqualTypeOf<Record<string, WbRules.Title> | undefined>()

  })

  it('Should expand type "value"', () => {

    const controlOptions: WbRules.ControlOptions = {
      type: 'value',
    }

    expectTypeOf(controlOptions.enum)
      .toEqualTypeOf<Record<number, WbRules.Title> | undefined>()

    expectTypeOf(controlOptions.min)
      .toEqualTypeOf<number | undefined>()

    expectTypeOf(controlOptions.max)
      .toEqualTypeOf<number | undefined>()

  })

  it('Should expand type "range"', () => {

    const controlOptions: WbRules.ControlOptions = {
      type: 'range',
    }

    expectTypeOf(controlOptions.min)
      .toEqualTypeOf<number | undefined>()

    expectTypeOf(controlOptions.max)
      .toEqualTypeOf<number | undefined>()

  })

})
