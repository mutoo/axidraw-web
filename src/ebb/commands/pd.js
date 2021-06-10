import { createCommand, handleOKMessage } from '../utils.js';

export default createCommand('Pin direction', function* (port, pin, direction) {
  const dataIn = yield `PD,${port},${pin},${direction}\r`;
  return yield* handleOKMessage(dataIn);
});
