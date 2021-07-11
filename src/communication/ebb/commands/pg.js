import { createCommand } from '../utils';
import handleOKMessage from '../messages/ok';

export default createCommand('Pulse go', function* (enable) {
  const dataIn = yield `PG,${enable}\r`;
  return yield* handleOKMessage(dataIn);
});
