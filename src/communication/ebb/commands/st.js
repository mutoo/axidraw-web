import { createCommand } from '../utils';
import handleOKMessage from '../messages/ok';

export const cmd = 'ST';

export default createCommand(
  cmd,
  'Set EBB nickname tag',
  function* (tag) {
    const dataIn = yield `${cmd},${tag}\r`;
    return yield* handleOKMessage(dataIn);
  },
  {
    version: '2.5.5',
  },
);
