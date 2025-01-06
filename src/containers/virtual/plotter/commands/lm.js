import { ENDING_OK_CR_NL } from 'communication/ebb/constants';
import { rate2s, rsa2t } from 'math/ebb';
import { runInAction } from 'mobx';
import { accelMotion } from '../utils';

export const cmd = 'LM';

export default {
  cmd,
  title: 'Low-level move, step-limited',
  async *create(context, rate1, step1, accel1, rate2, step2, accel2, clear) {
    const r1 = parseInt(rate1, 10) || 0;
    const s1 = parseInt(step1, 10) || 0;
    const a1 = parseInt(accel1, 10) || 0;
    const r2 = parseInt(rate2, 10) || 0;
    const s2 = parseInt(step2, 10) || 0;
    const a2 = parseInt(accel2, 10) || 0;
    const d1 = rsa2t({ rate: r1, step: Math.abs(s1), acc: a1 }) || 0;
    const d2 = rsa2t({ rate: r2, step: Math.abs(s2), acc: a2 }) || 0;
    const duration = Math.max(d1, d2) * 1000;
    yield ENDING_OK_CR_NL;
    if (context.mode === 'fast') {
      runInAction(() => {
        context.motor.a1 += s1;
        context.motor.a2 += s2;
      });
      return;
    }
    await accelMotion(
      context,
      [s1, s2],
      [rate2s(r1), rate2s(r2)],
      [rate2s(a1 * 25000), rate2s(a2 * 25000)],
      duration,
    );
  },
};
