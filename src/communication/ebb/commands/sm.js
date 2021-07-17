import { cmdWithOptionalParams, createCommand } from '../utils';
import { EXECUTION_FIFO } from '../constants';
import handleOKMessage from '../messages/ok';

export const cmd = 'SM';

export default createCommand(
  cmd,
  'Stepper move',
  function* (duration, axis1, axis2) {
    const dataIn = yield cmdWithOptionalParams(
      `${cmd},${duration},${axis1}`,
      axis2,
    );
    return yield* handleOKMessage(dataIn);
  },
  {
    execution: EXECUTION_FIFO,
  },
);
