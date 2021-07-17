import { createCommand } from '../utils';
import handleOKMessage from '../messages/ok';

export const cmd = 'PO';

export default createCommand(cmd, 'Pin output', function* (port, pin, value) {
  const dataIn = yield `${cmd},${port},${pin},${value}\r`;
  return yield* handleOKMessage(dataIn);
});
