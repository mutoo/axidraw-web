import handleOKMessage from '../messages/ok';
import { createCommand } from '../utils';

export const cmd = 'ST';

export default createCommand(
  cmd,
  'Set EBB nickname tag',
  function* (tag: string) {
    const dataIn = yield `${cmd},${tag}\r`;
    return yield* handleOKMessage(dataIn);
  },
  {
    version: '2.5.5',
  },
);
