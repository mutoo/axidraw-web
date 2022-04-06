import { ENDING_OK_CR_NL } from 'communication/ebb/constants';
import { delay } from 'utils/time';

export const cmd = 'TP';

export default {
  cmd,
  title: 'Toggle pen',
  async *create(context, duration) {
    context.pen = 1 - context.pen;
    if (duration) {
      await delay(duration);
    }
    return ENDING_OK_CR_NL;
  },
};
