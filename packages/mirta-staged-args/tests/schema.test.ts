import { createStagedArgs } from '#src/args';

describe('Schema validation', () => {

  it('should throw on duplicate name', () => {

    const schema = {
      debug: { type: 'string', short: 'v' },
      v: { type: 'boolean' },
    } as const;

    const args = createStagedArgs(['--v']);

    expect(() => args.parseFinal(schema)).toThrow(/already used/);

  });

  it('should throw on duplicate short name', () => {

    const schema = {
      help: { type: 'boolean', short: 'h' },
      header: { type: 'string', short: 'h' },
    } as const;

    const args = createStagedArgs(['-h']);

    expect(() => args.parseFinal(schema)).toThrow(/already used/);

  });

});
