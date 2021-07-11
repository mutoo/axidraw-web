import { createCommand } from '../utils';
import handleOKMessage from '../messages/ok';

export default createCommand(
  'Node count decrement',
  function* () {
    const dataIn = yield `ND\r`;
    return yield* handleOKMessage(dataIn);
  },
  {
    version: '1.9.5',
  },
);
