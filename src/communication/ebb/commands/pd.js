import { createCommand } from '../utils';
import handleOKMessage from '../messages/ok';

export default createCommand('Pin direction', function* (port, pin, direction) {
  const dataIn = yield `PD,${port},${pin},${direction}\r`;
  return yield* handleOKMessage(dataIn);
});
