import { createCommand } from '../utils';
import handleOKMessage from '../messages/ok';

export const cmd = 'PG';

export default createCommand(cmd, 'Pulse go', function* (enable) {
  const dataIn = yield `${cmd},${enable}\r`;
  return yield* handleOKMessage(dataIn);
});
