import handleOKMessage from '../messages/ok';
import { createCommand } from '../utils';

export const cmd = 'PG';

export default createCommand(cmd, 'Pulse go', function* (enable: number) {
  const dataIn = yield `${cmd},${enable.toFixed(0)}\r`;
  return yield* handleOKMessage(dataIn);
});
