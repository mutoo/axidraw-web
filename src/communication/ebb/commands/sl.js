import { createCommand } from '../utils';
import handleOKMessage from '../messages/ok';

export const cmd = 'SL';

export default createCommand(
  cmd,
  'Set layer',
  function* (layer) {
    const dataIn = yield `${cmd},${layer}\r`;
    return yield* handleOKMessage(dataIn);
  },
  {
    version: '1.9.2',
  },
);
