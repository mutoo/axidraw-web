import { createCommand } from '../utils';
import handleOKMessage from '../messages/ok';

export default createCommand(
  'Timed analog/digital read',
  function* (duration, mode) {
    const dataIn = yield `T,${duration},${mode}\r`;
    return yield* handleOKMessage(dataIn);
  },
);
