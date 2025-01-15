import handleOKMessage from '../messages/ok';
import { createCommand } from '../utils';

export const cmd = 'PO';

export default createCommand(cmd, 'Pin output', function* (port, pin, value) {
  const dataIn = yield `${cmd},${port},${pin},${value}\r`;
  return yield* handleOKMessage(dataIn);
});
