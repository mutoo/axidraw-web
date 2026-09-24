import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createVMContext } from '..';
import type { CommandGenerator } from '../command';
import em from '../commands/em';
import r from '../commands/r';
import sm from '../commands/sm';
import { penPosition } from '../utils';

// run a virtual command, including any motion, to completion
const run = async (cmd: CommandGenerator) => {
  const finished = (async () => {
    while (!(await cmd.next()).done) {
      // drain the responses
    }
  })();
  await vi.runAllTimersAsync();
  await finished;
};

// the expected behaviour below was observed on EBB firmware v2.8.1
describe('virtual plotter', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('keeps the step mode when EM disables motor 1', async () => {
    const context = createVMContext('2.8.1');
    await run(em.create(context, 2, 2));
    await run(em.create(context, 0, 0));
    await run(sm.create(context, 100, 2, 2));
    // 2 steps of 1/8 step each
    expect(penPosition(context)).toEqual({ a1: 4, a2: 4 });
  });

  it('clears the step counters on EM without moving the pen', async () => {
    const context = createVMContext('2.8.1');
    await run(sm.create(context, 100, 10, -10));
    await run(em.create(context, 1, 1));
    expect(context.motor).toMatchObject({ a1: 0, a2: 0 });
    expect(penPosition(context)).toEqual({ a1: 10, a2: -10 });
  });

  it('keeps the step counters on EM before firmware v2.6.2', async () => {
    const context = createVMContext('2.5.0');
    await run(sm.create(context, 100, 10, -10));
    await run(em.create(context, 2, 2));
    expect(context.motor).toMatchObject({ a1: 10, a2: -10, stepMode: 2 });
    expect(penPosition(context)).toEqual({ a1: 10, a2: -10 });
  });

  it('goes back to 1/16 steps and clears the step counters on R', async () => {
    const context = createVMContext('2.8.1');
    await run(em.create(context, 3, 3));
    await run(sm.create(context, 100, 5, 5));
    await run(r.create(context));
    expect(context.motor).toMatchObject({ a1: 0, a2: 0, stepMode: 1 });
    // 5 steps of 1/4 step each
    expect(penPosition(context)).toEqual({ a1: 20, a2: 20 });
  });
});
