import { createCommand } from '../utils';
import handleOKMessage from '../messages/ok';

export const cmd = 'PD';

export default createCommand(
  cmd,
  'Pin direction',
  function* (port, pin, direction) {
    const dataIn = yield `${cmd},${port},${pin},${direction}\r`;
    return yield* handleOKMessage(dataIn);
  },
);
