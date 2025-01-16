import { ENDING_OK_CR_NL } from '@/communication/ebb/constants';
import { CreateCommand } from '../command';

export default CreateCommand(
  'QS',
  'Query step position',
  // eslint-disable-next-line @typescript-eslint/require-await
  async function* (context) {
    const { a1, a2 } = context.motor;
    yield `${a1},${a2}\n\r${ENDING_OK_CR_NL}`;
    return;
  },
);
