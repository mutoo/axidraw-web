import { createCommand } from '../utils';
import handleOKMessage from '../messages/ok';

export const cmd = 'BL';

export default createCommand(
  cmd,
  'Enter bootloader',
  function* () {
    const dataIn = yield `${cmd}\r`;
    return yield* handleOKMessage(dataIn);
  },
  {
    version: '1.9.5',
  },
);
