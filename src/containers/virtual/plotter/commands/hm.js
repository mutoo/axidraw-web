import { ENDING_OK_CR_NL } from 'communication/ebb/constants';
import { linearMotion } from '../utils';

export const cmd = 'HM';

export default {
  cmd,
  title: 'Home or absolute move',
  async *create(context, stepFrequency, p1, p2) {
    const a1start = context.motor.a1;
    const a2start = context.motor.a2;
    const a1end = parseInt(p1, 10) || 0;
    const a2end = parseInt(p2, 10) || 0;
    const dist = Math.hypot(a1end - a1start, a2end - a2start);
    const duration = (dist / parseInt(stepFrequency, 10)) * 1000;
    await linearMotion(context, [a1end, a2end], duration);
    return ENDING_OK_CR_NL;
  },
};
