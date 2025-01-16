import { createCommand } from '../command';
import handleOKMessage from '../messages/ok';
import { noParameters } from '../utils';

export const cmd = 'BL';

export default createCommand(
  cmd,
  'Enter bootloader',
  function* () {
    const dataIn = yield `${cmd}\r`;
    return yield* handleOKMessage(dataIn);
  },
  noParameters,
  {
    version: '1.9.5',
  },
);
