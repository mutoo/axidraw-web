import { runInAction } from 'mobx';
import { ENDING_OK_CR_NL } from '@/communication/ebb/constants';
import { CreateCommand } from '../command';
import { keepPenInPlace } from '../utils';

export default CreateCommand(
  'R',
  'Reset',
  // eslint-disable-next-line @typescript-eslint/require-await
  async function* (context) {
    runInAction(() => {
      // like at power on: 1/16 steps and cleared step counters
      keepPenInPlace(context, () => {
        context.motor.a1 = 0;
        context.motor.a2 = 0;
        context.motor.stepMode = 1;
      });
    });
    yield ENDING_OK_CR_NL + ENDING_OK_CR_NL;
    return;
  },
);
