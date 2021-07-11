import { cmdWithOptionalParams, createCommand } from '../utils';
import handleOKMessage from '../messages/ok';

export default createCommand(
  'Toggle pen',
  function* (duration) {
    const dataIn = yield cmdWithOptionalParams(`TP`, duration);
    return yield* handleOKMessage(dataIn);
  },
  {
    version: '1.9.0',
  },
);
