import { ENDING_OK_CR_NL } from 'communication/ebb/constants';
import { delay } from 'utils/time';

export const cmd = 'SP';

export default {
  cmd,
  title: 'Set pen state',
  async *create(context, value, duration) {
    context.pen = value;
    if (duration) {
      await delay(duration);
    }
    return ENDING_OK_CR_NL;
  },
};
