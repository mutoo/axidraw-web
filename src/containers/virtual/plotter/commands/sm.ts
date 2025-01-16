import { runInAction } from 'mobx';
import { ENDING_OK_CR_NL } from '@/communication/ebb/constants';
import { delay } from '@/utils/time';
import { VirtualPlotterContext } from '..';
import { CreateCommand } from '../command';
import { linearMotion } from '../utils';

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

    if (context.mode === 'fast') {
      runInAction(() => {
        context.motor.a1 += delta1;
        context.motor.a2 += delta2;
      });
    }

    if (delta1 === 0 && delta2 === 0) {
      await delay(duration / 1000);
    } else {
      await linearMotion(
        context,
        [a1start + delta1, a2start + delta2],
        duration,
      );
    }
  },
);
