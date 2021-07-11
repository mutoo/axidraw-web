import { createCommand } from '../utils';
import handleOKMessage from '../messages/ok';

export default createCommand('Pin output', function* (port, pin, value) {
  const dataIn = yield `PO,${port},${pin},${value}\r`;
  return yield* handleOKMessage(dataIn);
});
