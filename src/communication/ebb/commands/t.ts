import handleOKMessage from '../messages/ok';
import { createCommand } from '../utils';

export const cmd = 'T';

export default createCommand(
  cmd,
  'Timed analog/digital read',
  function* (duration: number, mode: number) {
    const dataIn = yield `${cmd},${duration.toFixed(0)},${mode.toFixed(0)}\r`;
    return yield* handleOKMessage(dataIn);
  },
);
