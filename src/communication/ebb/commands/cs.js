import { createCommand } from '../utils';
import handleOKMessage from '../messages/ok';

export default createCommand(
  'Clear step position',
  function* () {
    const dataIn = yield 'CS\r';
    return yield* handleOKMessage(dataIn);
  },
  {
    version: '2.4.3',
  },
);
