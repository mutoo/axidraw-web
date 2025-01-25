import { createCommand } from '../command';
import handleOKMessage from '../messages/ok';

export const cmd = 'SN';

export default createCommand(
  cmd,
  'Set node count',
  function* (count: number) {
    const dataIn = yield `${cmd},${count.toFixed(0)}\r`;
    return yield* handleOKMessage(dataIn);
  },
  (params: string): [number] => {
    return [parseInt(params, 10)];
  },
  {
    version: '1.9.5',
  },
);
