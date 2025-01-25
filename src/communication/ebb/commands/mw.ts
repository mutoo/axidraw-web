import { createCommand } from '../command';
import handleOKMessage from '../messages/ok';

export const cmd = 'MW';

export default createCommand(
  cmd,
  'Memory Write',
  function* (address: number, data: number) {
    const dataIn = yield `${cmd},${address.toFixed(0)},${data.toFixed(0)}\r`;
    return yield* handleOKMessage(dataIn);
  },
  (params: string): [number, number] => {
    const [address, data] = params.split(',').map((p) => parseInt(p, 10));
    return [address, data];
  },
);
