import { runInAction } from 'mobx';
import { ENDING_OK_CR_NL } from '@/communication/ebb/constants';
import type { VirtualPlotterContext } from '..';
import { CreateCommand } from '../command';
import { play } from '../utils';

export const cmd = 'TP';

export default CreateCommand(
  'TP',
  'Toggle pen',
  async function* (context: VirtualPlotterContext, duration: number) {
    runInAction(() => {
      context.pen = 1 - context.pen;
    });
    await play(context, duration);
    yield ENDING_OK_CR_NL;
    return;
  },
);
