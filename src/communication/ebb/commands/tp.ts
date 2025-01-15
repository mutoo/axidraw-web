import handleOKMessage from '../messages/ok';
import { cmdWithOptionalParams, createCommand } from '../utils';

export const cmd = 'TP';

export default createCommand(
  cmd,
  'Toggle pen',
  function* (duration?: number) {
    const dataIn = yield cmdWithOptionalParams(cmd, duration);
    return yield* handleOKMessage(dataIn);
  },
  {
    version: '1.9.0',
  },
);
