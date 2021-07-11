import { cmdWithOptionalParams, createCommand } from '../utils';
import { EXECUTION_FIFO } from '../constants';
import handleOKMessage from '../messages/ok';

export default createCommand(
  'Set pen state',
  function* (value, duration, portBPin) {
    const dataIn = yield cmdWithOptionalParams(
      `SP,${value}`,
      duration,
      portBPin,
    );
    return yield* handleOKMessage(dataIn);
  },
  {
    execution: EXECUTION_FIFO,
  },
);
