import { runInAction } from 'mobx';
import { ENDING_OK_CR_NL } from '@/communication/ebb/constants';
import { delay } from '@/utils/time';
import { VirtualPlotterContext } from '..';
import { CreateCommand } from '../command';

export const cmd = 'TP';

export default CreateCommand(
  'TP',
  'Toggle pen',
  async function* (context: VirtualPlotterContext, duration: number) {
    runInAction(() => {
      context.pen = 1 - context.pen;
    });
    if (context.mode !== 'fast' && duration) {
      await delay(duration);
    }
    yield ENDING_OK_CR_NL;
    return;
  },
);
