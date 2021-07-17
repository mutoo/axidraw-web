import { createCommand } from '../utils';
import handleOKMessage from '../messages/ok';

export const cmd = 'T';

export default createCommand(
  cmd,
  'Timed analog/digital read',
  function* (duration, mode) {
    const dataIn = yield `${cmd},${duration},${mode}\r`;
    return yield* handleOKMessage(dataIn);
  },
);
