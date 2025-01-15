import handleOKMessage from '../messages/ok';
import { createCommand } from '../utils';

export const cmd = 'SL';

export default createCommand(
  cmd,
  'Set layer',
  function* (layer: number) {
    const dataIn = yield `${cmd},${layer.toFixed(0)}\r`;
    return yield* handleOKMessage(dataIn);
  },
  {
    version: '1.9.2',
  },
);
