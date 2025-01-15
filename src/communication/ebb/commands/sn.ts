import handleOKMessage from '../messages/ok';
import { createCommand } from '../utils';

export const cmd = 'SN';

export default createCommand(
  cmd,
  'Set node count',
  function* (count: number) {
    const dataIn = yield `${cmd},${count.toFixed(0)}\r`;
    return yield* handleOKMessage(dataIn);
  },
  {
    version: '1.9.5',
  },
);
