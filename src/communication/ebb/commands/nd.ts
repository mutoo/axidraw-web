import handleOKMessage from '../messages/ok';
import { createCommand } from '../utils';

export const cmd = 'ND';

export default createCommand(
  cmd,
  'Node count decrement',
  function* () {
    const dataIn = yield `ND\r`;
    return yield* handleOKMessage(dataIn);
  },
  {
    version: '1.9.5',
  },
);
