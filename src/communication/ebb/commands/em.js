import { createCommand } from '../utils';
import handleOKMessage from '../messages/ok';
import { EXECUTION_FIFO } from '../constants';

export default createCommand(
  'Enable Motors',
  function* (axis1, axis2) {
    const dataIn = yield `EM,${[axis1, axis2].join(',')}\r`;
    return yield* handleOKMessage(dataIn);
  },
  {
    execution: EXECUTION_FIFO,
  },
);
