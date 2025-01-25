import { runInAction } from 'mobx';
import { ENDING_OK_CR_NL } from '@/communication/ebb/constants';
import { VirtualPlotterContext } from '..';
import { CommandGenerator, CreateCommand } from '../command';

export default CreateCommand(
  'EM',
  'Enable motors',
  // eslint-disable-next-line @typescript-eslint/require-await
  async function* (
    context: VirtualPlotterContext,
    m1: number,
    m2: number,
  ): CommandGenerator {
    runInAction(() => {
      if (m1 === 0) {
        context.motor.m1 = 0;
      } else {
        context.motor.m1 = m1;
        context.motor.m2 = m1; // m2 will be set to whatever m1 set
      }
      if (m2 === 0) {
        context.motor.m2 = 0;
      }
    });
    yield ENDING_OK_CR_NL;
    return;
  },
);
