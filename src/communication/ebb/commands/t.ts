import { createCommand } from '../command';
import handleOKMessage from '../messages/ok';

export const cmd = 'T';

export default createCommand(
  cmd,
  'Timed analog/digital read',
  function* (duration: number, mode: number) {
    const dataIn = yield `${cmd},${duration.toFixed(0)},${mode.toFixed(0)}\r`;
    return yield* handleOKMessage(dataIn);
  },
  (params: string): [number, number] => {
    const [duration, mode] = params.split(',').map(Number);
    return [duration, mode];
  },
);
