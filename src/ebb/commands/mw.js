import { createCommand, handleOKMessage } from '../utils.js';

export default createCommand('Memory Write', function* (address, data) {
  const dataIn = yield `MW,${address},${data}\r`;
  return yield* handleOKMessage(dataIn);
});
