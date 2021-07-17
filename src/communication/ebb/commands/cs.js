import { createCommand } from '../utils';
import handleOKMessage from '../messages/ok';

export const cmd = 'CS';

export default createCommand(
  cmd,
  'Clear step position',
  function* () {
    const dataIn = yield `${cmd}\r`;
    return yield* handleOKMessage(dataIn);
  },
  {
    version: '2.4.3',
  },
);
