import handleOKMessage from '../messages/ok';
import { createCommand } from '../utils';

export const cmd = 'MW';

export default createCommand(
  cmd,
  'Memory Write',
  function* (address: number, data: number) {
    const dataIn = yield `${cmd},${address.toFixed(0)},${data.toFixed(0)}\r`;
    return yield* handleOKMessage(dataIn);
  },
);
