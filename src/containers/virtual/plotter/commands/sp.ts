import { runInAction } from 'mobx';
import { ENDING_OK_CR_NL } from '@/communication/ebb/constants';
import type { VirtualPlotterContext } from '..';
import { CreateCommand } from '../command';
import { play } from '../utils';

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
    await play(context, duration);
    yield ENDING_OK_CR_NL;
    return;
  },
);
