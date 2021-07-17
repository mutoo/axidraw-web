import { cmdWithOptionalParams, createCommand } from '../utils';
import { EXECUTION_FIFO } from '../constants';
import handleOKMessage from '../messages/ok';

export const cmd = 'SP';

export default createCommand(
  cmd,
  'Set pen state',
  function* (value, duration, portBPin) {
    const dataIn = yield cmdWithOptionalParams(
      `${cmd},${value}`,
      duration,
      portBPin,
    );
    return yield* handleOKMessage(dataIn);
  },
  {
    execution: EXECUTION_FIFO,
  },
);
