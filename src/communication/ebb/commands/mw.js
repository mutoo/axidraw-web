import { createCommand } from '../utils';
import handleOKMessage from '../messages/ok';

export default createCommand('Memory Write', function* (address, data) {
  const dataIn = yield `MW,${address},${data}\r`;
  return yield* handleOKMessage(dataIn);
});