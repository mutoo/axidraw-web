import { ENDING_OK_CR_NL } from 'communication/ebb/constants';
import { delay } from 'utils/time';
import { linearMotion } from '../utils';

export const cmd = 'SM';

export default {
  cmd,
  title: 'Stepper move',
  async *create(context, duration, s1, s2) {
    const a1start = context.motor.a1;
    const a2start = context.motor.a2;
    const delta1 = parseInt(s1, 10) || 0;
    const delta2 = parseInt(s2, 10) || 0;
    if (delta1 === 0 && delta2 === 0) {
      await delay(parseInt(duration, 10) / 1000);
    } else {
      await linearMotion(
        context,
        [a1start + delta1, a2start + delta2],
        parseInt(duration, 10),
      );
    }
    return ENDING_OK_CR_NL;
  },
};
