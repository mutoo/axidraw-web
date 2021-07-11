import { createCommand } from '../utils';
import handleOKMessage from '../messages/ok';

export default createCommand('Reset', function* () {
  let dataIn = yield 'R\r';
  const parsed = yield* handleOKMessage(dataIn);
  // the R command would receive OK twice
  dataIn = yield parsed;
  return yield* handleOKMessage(dataIn);
});
