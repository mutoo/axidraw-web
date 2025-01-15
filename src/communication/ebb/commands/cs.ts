import handleOKMessage from '../messages/ok';
import { createCommand } from '../utils';

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
