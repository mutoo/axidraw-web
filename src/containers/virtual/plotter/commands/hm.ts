import { ENDING_OK_CR_NL } from '@/communication/ebb/constants';
import type { VirtualPlotterContext } from '..';
import { CreateCommand } from '../command';
import { linearMotion } from '../utils';

export default CreateCommand(
  'HM',
  'Home or absolute move',
  async function* (
    context: VirtualPlotterContext,
    stepFrequency: number,
    p1: number = 0,
    p2: number = 0,
  ) {
    const a1start = context.motor.a1;
    const a2start = context.motor.a2;
    const a1end = p1;
    const a2end = p2;
    yield ENDING_OK_CR_NL;

    const dist = Math.hypot(a1end - a1start, a2end - a2start);
    const duration = (dist / stepFrequency) * 1000;
    await linearMotion(context, [a1end, a2end], duration);
  },
);
