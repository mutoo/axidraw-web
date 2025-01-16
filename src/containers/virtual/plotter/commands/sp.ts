import { runInAction } from 'mobx';
import { ENDING_OK_CR_NL } from '@/communication/ebb/constants';
import { delay } from '@/utils/time';
import { VirtualPlotterContext } from '..';
import { CreateCommand } from '../command';

export default CreateCommand(
  'SP',
  'Set pen state',
  async function* (
    context: VirtualPlotterContext,
    value: number,
    duration: number,
  ) {
    runInAction(() => {
      context.pen = value;
    });
    if (context.mode !== 'fast' && duration) {
      await delay(duration);
    }
    yield ENDING_OK_CR_NL;
    return;
  },
);
