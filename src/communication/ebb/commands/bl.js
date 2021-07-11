import { createCommand } from '../utils';
import handleOKMessage from '../messages/ok';

export default createCommand(
  'Enter bootloader',
  function* () {
    const dataIn = yield 'BL\r';
    return yield* handleOKMessage(dataIn);
  },
  {
    version: '1.9.5',
  },
);
