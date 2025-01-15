import handleOKMessage from '../messages/ok';
import { createCommand } from '../utils';

export const cmd = 'NI';

export default createCommand(
  cmd,
  'Node count increment',
  function* () {
    const dataIn = yield `NI\r`;
    return yield* handleOKMessage(dataIn);
  },
  {
    version: '1.9.5',
  },
);
