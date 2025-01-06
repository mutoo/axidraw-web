import { ENDING_OK_CR_NL } from 'communication/ebb/constants';
import { delay } from 'utils/time';
import { runInAction } from 'mobx';

export const cmd = 'TP';

export default {
  cmd,
  title: 'Toggle pen',
  async *create(context, duration) {
    runInAction(() => {
      context.pen = 1 - context.pen;
    });
    if (context.mode !== 'fast' && duration) {
      await delay(duration);
    }
    return ENDING_OK_CR_NL;
  },
};
