import { createCommand, handleOKMessage } from '../utils.js';

export default createCommand('Pulse go', function* (enable) {
  const dataIn = yield `PG,${enable}\r`;
  return yield* handleOKMessage(dataIn);
});
