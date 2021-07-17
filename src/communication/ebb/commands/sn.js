import { createCommand } from '../utils';
import handleOKMessage from '../messages/ok';

export const cmd = 'SN';

export default createCommand(
  cmd,
  'Set node count',
  function* (count) {
    const dataIn = yield `${cmd},${count}\r`;
    return yield* handleOKMessage(dataIn);
  },
  {
    version: '1.9.5',
  },
);
