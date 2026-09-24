import { ENDING_OK_CR_NL } from '@/communication/ebb/constants';
import type { VirtualPlotterContext } from '..';
import { CreateCommand } from '../command';
import { linearMotion, play } from '../utils';

export default CreateCommand(
  'SM',
  'Stepper move',
  async function* (
    context: VirtualPlotterContext,
    duration: number,
    delta1: number = 0,
    delta2: number = 0,
  ) {
    const a1start = context.motor.a1;
    const a2start = context.motor.a2;
    yield ENDING_OK_CR_NL;

    if (delta1 === 0 && delta2 === 0) {
      await play(context, duration);
    } else {
      await linearMotion(
        context,
        [a1start + delta1, a2start + delta2],
        duration,
      );
    }
  },
);
