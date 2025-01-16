import { createCommand } from '../command';
import handleOKMessage from '../messages/ok';

export const cmd = 'PG';

export default createCommand(
  cmd,
  'Pulse go',
  function* (enable: number) {
    const dataIn = yield `${cmd},${enable.toFixed(0)}\r`;
    return yield* handleOKMessage(dataIn);
  },
  (params: string): [number] => {
    const [enable] = params.split(',').map((p) => parseInt(p, 10));
    return [enable];
  },
);
