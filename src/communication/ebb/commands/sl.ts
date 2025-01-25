import { createCommand } from '../command';
import handleOKMessage from '../messages/ok';

export const cmd = 'SL';

export default createCommand(
  cmd,
  'Set layer',
  function* (layer: number) {
    const dataIn = yield `${cmd},${layer.toFixed(0)}\r`;
    return yield* handleOKMessage(dataIn);
  },
  (params: string): [number] => {
    return [parseInt(params, 10)];
  },
  {
    version: '1.9.2',
  },
);
