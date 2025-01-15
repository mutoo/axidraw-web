import { EXECUTION_FIFO } from '../constants';
import handleOKMessage from '../messages/ok';
import { createCommand } from '../utils';

export const cmd = 'EM';

export default createCommand(
  cmd,
  'Enable Motors',
  function* (axis1, axis2) {
    const dataIn = yield `${cmd},${[axis1, axis2].join(',')}\r`;
    return yield* handleOKMessage(dataIn);
  },
  {
    execution: EXECUTION_FIFO,
  },
);
