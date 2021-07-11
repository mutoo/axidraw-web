import { cmdWithOptionalParams, createCommand } from '../utils';
import { EXECUTION_FIFO } from '../constants';
import handleOKMessage from '../messages/ok';

export default createCommand(
  'Stepper move',
  function* (duration, axis1, axis2) {
    const dataIn = yield cmdWithOptionalParams(
      `SM,${duration},${axis1}`,
      axis2,
    );
    return yield* handleOKMessage(dataIn);
  },
  {
    execution: EXECUTION_FIFO,
  },
);
