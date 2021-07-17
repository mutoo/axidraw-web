import { cmdWithOptionalParams, createCommand } from '../utils';
import handleOKMessage from '../messages/ok';

export const cmd = 'TP';

export default createCommand(
  cmd,
  'Toggle pen',
  function* (duration) {
    const dataIn = yield cmdWithOptionalParams(`${cmd}`, duration);
    return yield* handleOKMessage(dataIn);
  },
  {
    version: '1.9.0',
  },
);
