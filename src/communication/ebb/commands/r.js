import { createCommand } from '../utils';
import handleOKMessage from '../messages/ok';

export const cmd = 'R';

export default createCommand(cmd, 'Reset', function* () {
  let dataIn = yield `${cmd}\r`;
  const parsed = yield* handleOKMessage(dataIn);
  // the R command would receive OK twice
  dataIn = yield parsed;
  return yield* handleOKMessage(dataIn);
});
