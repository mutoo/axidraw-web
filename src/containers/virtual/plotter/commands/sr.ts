import { ENDING_OK_CR_NL } from '@/communication/ebb/constants';
import { CreateCommand } from '../command';

export default CreateCommand(
  'SR',
  'Set RC Servo power timeout',
  // eslint-disable-next-line @typescript-eslint/require-await
  async function* () {
    yield ENDING_OK_CR_NL;
    return;
  },
);
