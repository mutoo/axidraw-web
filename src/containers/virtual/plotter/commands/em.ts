import { runInAction } from 'mobx';
import { ENDING_OK_CR_NL } from '@/communication/ebb/constants';
import { checkVersion } from '@/communication/ebb/utils';
import type { VirtualPlotterContext } from '..';
import type { CommandGenerator } from '../command';
import { CreateCommand } from '../command';
import { keepPenInPlace } from '../utils';

export default CreateCommand(
  'EM',
  'Enable motors',
  // eslint-disable-next-line @typescript-eslint/require-await
  async function* (
    context: VirtualPlotterContext,
    m1: number,
    // the virtual motors never freewheel, so enabling them changes nothing
    _m2: number,
  ): CommandGenerator {
    runInAction(() => {
      keepPenInPlace(context, () => {
        // since v2.6.2, every EM clears the global step counters
        if (checkVersion(context.version, '2.6.2')) {
          context.motor.a1 = 0;
          context.motor.a2 = 0;
        }
        // only Enable1 sets the step mode, and 0 just disables motor 1
        if (m1 >= 1 && m1 <= 5) {
          context.motor.stepMode = m1;
        }
      });
    });
    yield ENDING_OK_CR_NL;
    return;
  },
);
