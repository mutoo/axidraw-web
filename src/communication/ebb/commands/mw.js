import { createCommand } from '../utils';
import handleOKMessage from '../messages/ok';

export const cmd = 'MW';

export default createCommand(cmd, 'Memory Write', function* (address, data) {
  const dataIn = yield `${cmd},${address},${data}\r`;
  return yield* handleOKMessage(dataIn);
});
