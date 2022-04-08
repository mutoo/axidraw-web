import { ENDING_OK_CR_NL } from 'communication/ebb/constants';
import { delay } from 'utils/time';
import { runInAction } from 'mobx';

export const cmd = 'SP';

export default {
  cmd,
  title: 'Set pen state',
  async *create(context, value, duration) {
    runInAction(() => {
      context.pen = parseInt(value, 10);
    });
    if (duration) {
      await delay(duration);
    }
    return ENDING_OK_CR_NL;
  },
};
