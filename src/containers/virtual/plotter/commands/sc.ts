import { runInAction } from 'mobx';
import { ENDING_OK_CR_NL } from '@/communication/ebb/constants';
import { VirtualPlotterContext } from '..';
import { CreateCommand } from '../command';

export default CreateCommand(
  'SC',
  'Stepper and Servo mode configure',
  // eslint-disable-next-line @typescript-eslint/require-await
  async function* (context: VirtualPlotterContext, key: number, value: number) {
    runInAction(() => {
      switch (key) {
        case 4:
          context.servo.min = value;
          break;
        case 5:
          context.servo.max = value;
          break;
        case 10:
          context.servo.rate = value;
          break;
        default:
      }
    });
    yield ENDING_OK_CR_NL;
    return;
  },
);
