import { createCommand } from '../utils';
import handleOKMessage from '../messages/ok';

export default createCommand(
  'Set EBB nickname tag',
  function* (tag) {
    const dataIn = yield `ST,${tag}\r`;
    return yield* handleOKMessage(dataIn);
  },
  {
    version: '2.5.5',
  },
);
