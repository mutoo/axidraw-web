import { runInAction } from 'mobx';
import { ENDING_OK_CR_NL } from '@/communication/ebb/constants';
import { rate2s, rsa2t } from '@/math/ebb';
import { VirtualPlotterContext } from '..';
import { CreateCommand } from '../command';
import { accelMotion } from '../utils';

export default CreateCommand(
  'LM',
  'Low-level move, step-limited',
  async function* (
    context: VirtualPlotterContext,
    rate1: number = 0,
    step1: number = 0,
    accel1: number = 0,
    rate2: number = 0,
    step2: number = 0,
    accel2: number = 0,
    _clear: number = 0,
  ) {
    const d1 = rsa2t({ rate: rate1, step: Math.abs(step1), acc: accel1 }) || 0;
    const d2 = rsa2t({ rate: rate2, step: Math.abs(step2), acc: accel2 }) || 0;
    const duration = Math.max(d1, d2) * 1000;
    yield ENDING_OK_CR_NL;
    if (context.mode === 'fast') {
      runInAction(() => {
        context.motor.a1 += step1;
        context.motor.a2 += step2;
      });
      return;
    }
    await accelMotion(
      context,
      [step1, step2],
      [rate2s(rate1), rate2s(rate2)],
      [rate2s(accel1 * 25000), rate2s(accel2 * 25000)],
      duration,
    );
  },
);
